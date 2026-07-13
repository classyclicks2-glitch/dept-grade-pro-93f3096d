import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listUpdates = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ deptSlug: z.string().optional(), limit: z.number().int().min(1).max(500).optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const { requireAny } = await import("./session.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const s = await requireAny();
    const slug = s.role === "dept" ? s.deptSlug! : data.deptSlug;
    let q = supabaseAdmin
      .from("dept_updates")
      .select("id,department_slug,author_name,content,update_date,created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (slug) q = q.eq("department_slug", slug);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const addUpdate = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      author_name: z.string().trim().min(1).max(120),
      content: z.string().trim().min(1).max(2000),
      update_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { requireDept } = await import("./session.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { deptSlug } = await requireDept();
    const { data: row, error } = await supabaseAdmin
      .from("dept_updates")
      .insert({
        department_slug: deptSlug,
        author_name: data.author_name,
        content: data.content,
        ...(data.update_date ? { update_date: data.update_date } : {}),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteUpdate = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { requireAny } = await import("./session.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const s = await requireAny();
    let q = supabaseAdmin.from("dept_updates").delete().eq("id", data.id);
    if (s.role === "dept") q = q.eq("department_slug", s.deptSlug!);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });
