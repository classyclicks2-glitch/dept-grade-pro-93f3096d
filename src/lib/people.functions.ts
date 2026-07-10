import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listPeople = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ includeInactive: z.boolean().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const { requireDept } = await import("./session.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { deptSlug } = await requireDept();
    const q = supabaseAdmin
      .from("people")
      .select("id,name,role,instagram,email,phone,status,status_reason,leave_start,leave_end")
      .eq("department_slug", deptSlug)
      .not("status", "in", "(terminated,resigned)")
      .order("name");
    if (!data.includeInactive) {
      // still hide none — dept sees on_leave / inactive but not terminated/resigned
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const addPersonInput = z.object({
  name: z.string().trim().min(1).max(120),
  role: z.string().trim().max(120).optional(),
  instagram: z.string().trim().max(120).optional(),
  email: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(60).optional(),
});

export const addPerson = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => addPersonInput.parse(d))
  .handler(async ({ data }) => {
    const { requireDept } = await import("./session.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { deptSlug } = await requireDept();
    const { data: row, error } = await supabaseAdmin
      .from("people")
      .insert({
        name: data.name,
        role: data.role || null,
        instagram: data.instagram || null,
        email: data.email || null,
        phone: data.phone || null,
        department_slug: deptSlug,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const getPerson = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { requireAny } = await import("./session.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const s = await requireAny();
    const { data: p, error } = await supabaseAdmin
      .from("people")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    if (s.role === "dept" && p.department_slug !== s.deptSlug) {
      throw new Error("Not found");
    }
    return p;
  });

// Admin: everyone including terminated
export const adminListAllPeople = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ vault: z.boolean().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./session.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireAdmin();
    const q = supabaseAdmin.from("people").select("*").order("department_slug").order("name");
    const filtered = data.vault
      ? q.in("status", ["terminated", "resigned"])
      : q.not("status", "in", "(terminated,resigned)");
    const { data: rows, error } = await filtered;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// Totals per person (sum of all grade fields incl. hod_grade). Admin: all people. Dept: own dept.
export const listTotals = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({}).parse(d ?? {}))
  .handler(async () => {
    const { requireAny } = await import("./session.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const s = await requireAny();

    let personQuery = supabaseAdmin.from("people").select("id,department_slug");
    if (s.role === "dept") personQuery = personQuery.eq("department_slug", s.deptSlug!);
    const { data: people, error: pe } = await personQuery;
    if (pe) throw new Error(pe.message);
    const ids = (people ?? []).map((p) => p.id);
    if (ids.length === 0) return {} as Record<string, number>;

    const { data: grades, error: ge } = await supabaseAdmin
      .from("grades")
      .select("person_id,dept_task_grade,da_task_grade,mkt_task_grade,hr_task_grade,ethics_grade,other_grade,hod_grade")
      .in("person_id", ids);
    if (ge) throw new Error(ge.message);

    const totals: Record<string, number> = {};
    for (const id of ids) totals[id] = 0;
    for (const g of grades ?? []) {
      const sum =
        (Number(g.dept_task_grade) || 0) +
        (Number(g.da_task_grade) || 0) +
        (Number(g.mkt_task_grade) || 0) +
        (Number(g.hr_task_grade) || 0) +
        (Number(g.ethics_grade) || 0) +
        (Number(g.other_grade) || 0) +
        (Number(g.hod_grade) || 0);
      totals[g.person_id] = (totals[g.person_id] ?? 0) + sum;
    }
    return totals;
  });
