import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSessionInfo } from "@/lib/gate.functions";
import { listPeople } from "@/lib/people.functions";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/dashboard")({
  loader: async () => {
    const s = await getSessionInfo();
    if (s.role !== "dept") throw redirect({ to: "/unlock" });
    return s;
  },
  component: Dashboard,
});

function Dashboard() {
  const s = Route.useLoaderData();
  const fetchPeople = useServerFn(listPeople);
  const { data: people = [], isLoading } = useQuery({
    queryKey: ["people", s.deptSlug],
    queryFn: () => fetchPeople({ data: {} }),
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title={s.deptName ?? "Department"}
        subtitle="Team members"
        right={
          <Button asChild size="sm">
            <Link to="/people/new">Add person</Link>
          </Button>
        }
      />
      <main className="mx-auto max-w-6xl px-4 py-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : people.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <p className="text-muted-foreground">No people yet in this department.</p>
            <Button asChild className="mt-4">
              <Link to="/people/new">Add first person</Link>
            </Button>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {people.map((p) => (
              <li key={p.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    {p.role && <p className="text-sm text-muted-foreground">{p.role}</p>}
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="mt-4 flex gap-2">
                  <Button asChild size="sm" variant="default">
                    <Link to="/grade/$personId" params={{ personId: p.id }}>
                      Grade
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/status/$personId" params={{ personId: p.id }}>
                      Leave / Status
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    active: { label: "Active", variant: "default" },
    on_leave: { label: "On leave", variant: "secondary" },
    inactive: { label: "Inactive", variant: "outline" },
    terminated: { label: "Terminated", variant: "destructive" },
    resigned: { label: "Resigned", variant: "destructive" },
  };
  const s = map[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
