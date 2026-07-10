import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listCredentials = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({}).parse(d ?? {}))
  .handler(async () => {
    const { requireAdmin, DEPARTMENTS, currentDeptPassword, currentAdminPassword } = await import(
      "./session.server"
    );
    await requireAdmin();
    const depts = await Promise.all(
      DEPARTMENTS.map(async (d) => ({
        slug: d.slug,
        name: d.name,
        password: await currentDeptPassword(d.slug),
      })),
    );
    const admin = await currentAdminPassword();
    return { depts, admin };
  });

const setInput = z.object({
  slug: z.string().min(1).max(64),
  password: z.string().min(1).max(200),
});

export const setCredential = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => setInput.parse(d))
  .handler(async ({ data }) => {
    const { requireAdmin, DEPARTMENTS } = await import("./session.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireAdmin();
    const validSlugs = new Set([...DEPARTMENTS.map((d) => d.slug), "admin"]);
    if (!validSlugs.has(data.slug)) throw new Error("Unknown slug");
    const { error } = await supabaseAdmin
      .from("dept_credentials")
      .upsert({ slug: data.slug, password: data.password }, { onConflict: "slug" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
