import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");
const wholeNumberOrNull = z.union([z.number().finite().transform((n) => Math.round(n)), z.null()]).optional();
const strOrNull = z.union([z.string(), z.null()]).optional();

const saveInput = z.object({
  personId: z.string().uuid(),
  date: dateStr,
  dept_task_detail: strOrNull,
  dept_task_grade: wholeNumberOrNull,
  da_task_detail: strOrNull,
  da_task_grade: wholeNumberOrNull,
  mkt_task_detail: strOrNull,
  mkt_task_grade: wholeNumberOrNull,
  hr_task_detail: strOrNull,
  hr_task_grade: wholeNumberOrNull,
  ethics: z.enum(["good", "bad", "na"]).optional(),
  ethics_grade: wholeNumberOrNull,
  ethics_comment: strOrNull,
  other_remarks: strOrNull,
  other_grade: wholeNumberOrNull,
});

export const getGrade = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ personId: z.string().uuid(), date: dateStr }).parse(d),
  )
  .handler(async ({ data }) => {
    const { requireAny } = await import("./session.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const s = await requireAny();
    const { data: person, error: pe } = await supabaseAdmin
      .from("people")
      .select("id,department_slug")
      .eq("id", data.personId)
      .single();
    if (pe) throw new Error(pe.message);
    if (s.role === "dept" && person.department_slug !== s.deptSlug)
      throw new Error("Not found");
    const { data: row } = await supabaseAdmin
      .from("grades")
      .select("*")
      .eq("person_id", data.personId)
      .eq("date", data.date)
      .maybeSingle();
    if (row && s.role !== "admin") {
      // strip HOD fields for non-admin
      row.hod_remarks = null;
      row.hod_grade = null;
    }
    return row;
  });

export const saveGrade = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => saveInput.parse(d))
  .handler(async ({ data }) => {
    const { requireDept } = await import("./session.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { deptSlug } = await requireDept();

    const { data: person, error: pe } = await supabaseAdmin
      .from("people")
      .select("id,department_slug")
      .eq("id", data.personId)
      .single();
    if (pe) throw new Error(pe.message);
    if (person.department_slug !== deptSlug) throw new Error("Not your department");

    // Auto ethics grade for good
    let ethicsGrade = data.ethics_grade ?? null;
    if (data.ethics === "good") ethicsGrade = 1;
    if (data.ethics === "na") ethicsGrade = 0;

    const payload = {
      person_id: data.personId,
      date: data.date,
      dept_task_detail: data.dept_task_detail ?? null,
      dept_task_grade: data.dept_task_grade ?? null,
      da_task_detail: data.da_task_detail ?? null,
      da_task_grade: data.da_task_grade ?? null,
      mkt_task_detail: data.mkt_task_detail ?? null,
      mkt_task_grade: data.mkt_task_grade ?? null,
      hr_task_detail: data.hr_task_detail ?? null,
      hr_task_grade: data.hr_task_grade ?? null,
      ethics: data.ethics ?? null,
      ethics_grade: ethicsGrade,
      ethics_comment: data.ethics_comment ?? null,
      other_remarks: data.other_remarks ?? null,
      other_grade: data.other_grade ?? null,
      is_auto_na: false,
      created_by_dept: deptSlug,
    };

    const { error } = await supabaseAdmin
      .from("grades")
      .upsert(payload, { onConflict: "person_id,date" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// admin-only: edit any field including HOD
const adminEditInput = saveInput.extend({
  hod_remarks: strOrNull,
  hod_grade: wholeNumberOrNull,
});
export const adminEditGrade = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => adminEditInput.parse(d))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./session.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireAdmin();
    const payload = {
      person_id: data.personId,
      date: data.date,
      dept_task_detail: data.dept_task_detail ?? null,
      dept_task_grade: data.dept_task_grade ?? null,
      da_task_detail: data.da_task_detail ?? null,
      da_task_grade: data.da_task_grade ?? null,
      mkt_task_detail: data.mkt_task_detail ?? null,
      mkt_task_grade: data.mkt_task_grade ?? null,
      hr_task_detail: data.hr_task_detail ?? null,
      hr_task_grade: data.hr_task_grade ?? null,
      ethics: data.ethics ?? null,
      ethics_grade: data.ethics_grade ?? null,
      ethics_comment: data.ethics_comment ?? null,
      other_remarks: data.other_remarks ?? null,
      other_grade: data.other_grade ?? null,
      hod_remarks: data.hod_remarks ?? null,
      hod_grade: data.hod_grade ?? null,
    };
    const { error } = await supabaseAdmin
      .from("grades")
      .upsert(payload, { onConflict: "person_id,date" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// list grades for a person over a date range
export const listGrades = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({
      personId: z.string().uuid(),
      from: dateStr,
      to: dateStr,
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { requireAny } = await import("./session.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const s = await requireAny();
    const { data: person, error: pe } = await supabaseAdmin
      .from("people")
      .select("id,department_slug")
      .eq("id", data.personId)
      .single();
    if (pe) throw new Error(pe.message);
    if (s.role === "dept" && person.department_slug !== s.deptSlug)
      throw new Error("Not found");

    const { data: rows, error } = await supabaseAdmin
      .from("grades")
      .select("*")
      .eq("person_id", data.personId)
      .gte("date", data.from)
      .lte("date", data.to)
      .order("date");
    if (error) throw new Error(error.message);
    if (s.role !== "admin") {
      for (const r of rows ?? []) {
        r.hod_remarks = null;
        r.hod_grade = null;
      }
    }
    return rows ?? [];
  });
