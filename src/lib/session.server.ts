// Server-only session helpers for the shared-password gate.
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

export const DEPARTMENTS: { slug: string; name: string; env: string }[] = [
  { slug: "delegate_affairs", name: "Delegate Affairs", env: "SITE_PW_delegate_affairs" },
  { slug: "marketing", name: "Marketing", env: "SITE_PW_marketing" },
  { slug: "hr", name: "HR", env: "SITE_PW_hr" },
  { slug: "academics", name: "Academics", env: "SITE_PW_academics" },
  { slug: "corporate_affairs", name: "Corporate Affairs", env: "SITE_PW_corporate_affairs" },
];

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

export function findMatchingDepts(password: string) {
  return DEPARTMENTS.filter((d) => {
    const expected = process.env[d.env];
    return expected && passwordMatches(password, expected);
  });
}

export function isAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
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
