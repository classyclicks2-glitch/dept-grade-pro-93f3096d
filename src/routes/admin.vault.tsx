import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSessionInfo } from "@/lib/gate.functions";
import { adminListAllPeople } from "@/lib/people.functions";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/vault")({
  loader: async () => {
    const s = await getSessionInfo();
    if (s.role !== "admin") throw redirect({ to: "/unlock" });
    return s;
  },
  component: Vault,
});

function Vault() {
  const fetchAll = useServerFn(adminListAllPeople);
  const { data: people = [], isLoading } = useQuery({
    queryKey: ["admin", "vault"],
    queryFn: () => fetchAll({ data: { vault: true } }),
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title="Vault"
        subtitle="Terminated & resigned"
        right={
          <Button asChild variant="outline" size="sm">
            <Link to="/admin">Back</Link>
          </Button>
        }
      />
      <main className="mx-auto max-w-4xl px-4 py-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : people.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nobody here yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border bg-card">
            {people.map((p) => (
              <li key={p.id} className="flex items-center justify-between p-4">
                <div>
                  <Link
                    to="/admin/person/$personId"
                    params={{ personId: p.id }}
                    className="font-medium hover:underline"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {p.department_slug} · {p.status}
                    {p.status_reason ? ` · ${p.status_reason}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
