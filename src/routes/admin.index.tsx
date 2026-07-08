import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSessionInfo } from "@/lib/gate.functions";
import { adminListAllPeople } from "@/lib/people.functions";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
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
  const { data: people = [], isLoading } = useQuery({
    queryKey: ["admin", "people"],
    queryFn: () => fetchAll({ data: {} }),
  });

  const byDept = people.reduce<Record<string, typeof people>>((acc, p) => {
    (acc[p.department_slug] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
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
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {Object.entries(byDept).map(([slug, list]) => (
          <section key={slug}>
            <h2 className="mb-2 text-lg font-semibold">{DEPT_LABELS[slug] ?? slug}</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {list.map((p) => (
                <li key={p.id} className="rounded-lg border bg-card p-3">
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
