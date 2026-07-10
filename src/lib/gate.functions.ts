import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getSessionInfo = createServerFn({ method: "GET" }).handler(async () => {
  const { getSession } = await import("./session.server");
  const s = await getSession();
  return {
    role: s.data.role ?? null,
    deptSlug: s.data.deptSlug ?? null,
    deptName: s.data.deptName ?? null,
  };
});

const unlockInput = z.object({
  password: z.string().min(1).max(200),
  deptSlug: z.string().optional(),
});

export const unlock = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => unlockInput.parse(d))
  .handler(async ({ data }) => {
    const {
      getSession,
      isAdminPassword,
      findMatchingDepts,
    } = await import("./session.server");

    if (await isAdminPassword(data.password)) {
      const s = await getSession();
      await s.update({ role: "admin", deptSlug: undefined, deptName: undefined });
      return { ok: true as const, role: "admin" as const };
    }
    const matches = await findMatchingDepts(data.password);
    if (matches.length === 0) return { ok: false as const };

    let chosen = matches[0];
    if (matches.length > 1) {
      if (!data.deptSlug) {
        return {
          ok: true as const,
          role: "choose" as const,
          options: matches.map((m) => ({ slug: m.slug, name: m.name })),
        };
      }
      const found = matches.find((m) => m.slug === data.deptSlug);
      if (!found) return { ok: false as const };
      chosen = found;
    }

    const s = await getSession();
    await s.update({ role: "dept", deptSlug: chosen.slug, deptName: chosen.name });
    return {
      ok: true as const,
      role: "dept" as const,
      deptSlug: chosen.slug,
      deptName: chosen.name,
    };
  });

export const lock = createServerFn({ method: "POST" }).handler(async () => {
  const { getSession } = await import("./session.server");
  const s = await getSession();
  await s.clear();
  return { ok: true as const };
});
