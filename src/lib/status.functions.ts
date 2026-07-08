import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const statusInput = z.object({
  personId: z.string().uuid(),
  status: z.enum(["active", "on_leave", "inactive", "terminated", "resigned"]),
  reason: z.string().max(500).optional(),
  leave_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  leave_days: z.number().int().min(1).max(365).optional(),
});

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function iterDates(from: string, to: string): string[] {
  const out: string[] = [];
  let cur = from;
  while (cur <= to) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

export const setStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => statusInput.parse(d))
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
    if (s.role !== "admin" && person.department_slug !== s.deptSlug)
      throw new Error("Not your department");

    let leave_end: string | null = null;
    let leave_start: string | null = null;
    if (data.status === "on_leave") {
      if (!data.leave_start || !data.leave_days)
        throw new Error("leave_start and leave_days required");
      leave_start = data.leave_start;
      leave_end = addDays(data.leave_start, data.leave_days - 1);
    }

    const { error: uerr } = await supabaseAdmin
      .from("people")
      .update({
        status: data.status,
        status_reason: data.reason || null,
        leave_start,
        leave_end,
      })
      .eq("id", data.personId);
    if (uerr) throw new Error(uerr.message);

    await supabaseAdmin.from("status_history").insert({
      person_id: data.personId,
      status: data.status,
      reason: data.reason || null,
      leave_start,
      leave_end,
      changed_by_dept: s.role === "admin" ? "admin" : s.deptSlug!,
    });

    // Auto-fill N/A for leave range
    if (data.status === "on_leave" && leave_start && leave_end) {
      const dates = iterDates(leave_start, leave_end);
      const rows = dates.map((date) => ({
        person_id: data.personId,
        date,
        dept_task_grade: 0,
        da_task_grade: 0,
        mkt_task_grade: 0,
        hr_task_grade: 0,
        ethics: "na" as const,
        ethics_grade: 0,
        other_grade: 0,
        dept_task_detail: "On leave",
        da_task_detail: "On leave",
        mkt_task_detail: "On leave",
        hr_task_detail: "On leave",
        ethics_comment: "On leave",
        other_remarks: "On leave",
        is_auto_na: true,
        created_by_dept: s.role === "admin" ? "admin" : s.deptSlug!,
      }));
      const { error: gerr } = await supabaseAdmin
        .from("grades")
        .upsert(rows, { onConflict: "person_id,date" });
      if (gerr) throw new Error(gerr.message);
    }

    return { ok: true };
  });
