import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getSessionInfo } from "@/lib/gate.functions";
import { adminListAllPeople, listTotals } from "@/lib/people.functions";
import { listCredentials, setCredential } from "@/lib/credentials.functions";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/")({
  loader: async () => {
    const s = await getSessionInfo();
    if (s.role !== "admin") throw redirect({ to: "/unlock" });
    return s;
  },
  component: AdminHome,
});

const DEPT_LABELS: Record<string, string> = {
  delegate_affairs: "Delegate Affairs",
  marketing: "Marketing",
  hr: "HR",
  academics: "Academics",
  corporate_affairs: "Corporate Affairs",
};

function AdminHome() {
  const fetchAll = useServerFn(adminListAllPeople);
  const fetchTotals = useServerFn(listTotals);
  const { data: people = [], isLoading } = useQuery({
    queryKey: ["admin", "people"],
    queryFn: () => fetchAll({ data: {} }),
  });
  const { data: totals = {} } = useQuery({
    queryKey: ["admin", "totals"],
    queryFn: () => fetchTotals({ data: {} }),
  });

  const grandTotal = Object.values(totals).reduce((a, b) => a + (b as number), 0);

  const byDept = people.reduce<Record<string, typeof people>>((acc, p) => {
    (acc[p.department_slug] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="min-h-screen">
      <AppHeader
        title="Admin"
        subtitle="All departments"
        right={
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/vault">Vault</Link>
          </Button>
        }
      />
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <div className="rounded-2xl unicorn-gradient p-6 text-white shadow-[var(--shadow-unicorn)]">
          <p className="text-sm opacity-90">Total marks of everyone (incl. HOD grade)</p>
          <p className="mt-2 text-5xl font-bold">{grandTotal.toFixed(1)}</p>
          <p className="mt-1 text-xs opacity-80">{people.length} people · all-time sum</p>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {Object.entries(byDept).map(([slug, list]) => (
          <section key={slug}>
            <h2 className="mb-2 text-lg font-semibold unicorn-text">{DEPT_LABELS[slug] ?? slug}</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {list.map((p) => (
                <li key={p.id} className="rounded-2xl border bg-card p-3 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Link
                        to="/admin/person/$personId"
                        params={{ personId: p.id }}
                        className="font-medium hover:underline"
                      >
                        {p.name}
                      </Link>
                      {p.role && <p className="text-xs text-muted-foreground">{p.role}</p>}
                      <p className="mt-1 text-sm">
                        <span className="text-muted-foreground">Total: </span>
                        <span className="unicorn-text font-bold">{(totals[p.id] ?? 0).toFixed(1)}</span>
                      </p>
                    </div>
                    <Badge variant={p.status === "active" ? "default" : "secondary"}>{p.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
