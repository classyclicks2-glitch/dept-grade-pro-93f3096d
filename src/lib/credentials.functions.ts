import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listCredentials = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({}).parse(d ?? {}))
  .handler(async () => {
    const { requireAdmin, DEPARTMENTS, currentAdminPassword } = await import(
      "./session.server"
    );
    await requireAdmin();
    const depts = DEPARTMENTS.map((d) => ({
      slug: d.slug,
      name: d.name,
      password: d.password,
    }));
    const admin = await currentAdminPassword();
    return { depts, admin };
  });
