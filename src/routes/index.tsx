import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSessionInfo } from "@/lib/gate.functions";

export const Route = createFileRoute("/")({
  loader: async () => {
    const s = await getSessionInfo();
    if (s.role === "admin") throw redirect({ to: "/admin" });
    if (s.role === "dept") throw redirect({ to: "/dashboard" });
    throw redirect({ to: "/unlock" });
  },
  component: () => null,
});
