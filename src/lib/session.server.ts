// Server-only session helpers for the shared-password gate.
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

export const DEPARTMENTS: { slug: string; name: string; password: string }[] = [
  { slug: "delegate_affairs", name: "Delegate Affairs", password: "2222" },
  { slug: "marketing", name: "Marketing", password: "1111" },
  { slug: "hr", name: "HR", password: "0000" },
  { slug: "academics", name: "Academics", password: "3333" },
  { slug: "corporate_affairs", name: "Corporate Affairs", password: "4444" },
];

const ADMIN_PW_FALLBACK = "admin";


export type GateSession = {
  role?: "admin" | "dept";
  deptSlug?: string;
  deptName?: string;
};

function sessionConfig() {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("SESSION_SECRET missing or too short");
  }
  return {
    password,
    name: "grading-gate",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

export function getSession() {
  return useSession<GateSession>(sessionConfig());
}

export function passwordMatches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

async function getStoredPassword(slug: string): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("dept_credentials")
    .select("password")
    .eq("slug", slug)
    .maybeSingle();
  return data?.password ?? null;
}

export async function currentDeptPassword(slug: string): Promise<string> {
  const stored = await getStoredPassword(slug);
  if (stored) return stored;
  const dept = DEPARTMENTS.find((d) => d.slug === slug);
  return (dept && process.env[dept.env]) || "";
}

export async function currentAdminPassword(): Promise<string> {
  const stored = await getStoredPassword("admin");
  if (stored) return stored;
  return process.env.ADMIN_PASSWORD ?? "";
}

export async function findMatchingDepts(password: string) {
  const results: { slug: string; name: string }[] = [];
  for (const d of DEPARTMENTS) {
    const expected = await currentDeptPassword(d.slug);
    if (expected && passwordMatches(password, expected)) {
      results.push({ slug: d.slug, name: d.name });
    }
  }
  return results;
}

export async function isAdminPassword(password: string): Promise<boolean> {
  const expected = await currentAdminPassword();
  return !!expected && passwordMatches(password, expected);
}

export async function requireDept() {
  const s = await getSession();
  if (s.data.role !== "dept" || !s.data.deptSlug) {
    throw new Error("Unauthorized");
  }
  return { deptSlug: s.data.deptSlug, deptName: s.data.deptName! };
}

export async function requireAdmin() {
  const s = await getSession();
  if (s.data.role !== "admin") throw new Error("Unauthorized");
}

export async function requireAny() {
  const s = await getSession();
  if (!s.data.role) throw new Error("Unauthorized");
  return s.data;
}
