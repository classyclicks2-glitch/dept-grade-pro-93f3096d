import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSessionInfo } from "@/lib/gate.functions";
import { adminListAllPeople, listTotals } from "@/lib/people.functions";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/ranking")({
  loader: async () => {
    const s = await getSessionInfo();
    if (s.role !== "admin") throw redirect({ to: "/unlock" });
    return s;
  },
  component: RankingPage,
});

function RankingPage() {
  const fetchAll = useServerFn(adminListAllPeople);
  const fetchTotals = useServerFn(listTotals);
  const { data: people = [] } = useQuery({
    queryKey: ["admin", "people"],
    queryFn: () => fetchAll({ data: {} }),
  });
  const { data: totals = {} } = useQuery({
    queryKey: ["admin", "totals"],
    queryFn: () => fetchTotals({ data: {} }),
  });

  const ranked = [...people]
    .map((p) => ({ ...p, total: (totals as Record<string, number>)[p.id] ?? 0 }))
    .sort((a, b) => b.total - a.total);

  const medal = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`);

  return (
    <div className="min-h-screen">
      <AppHeader
        title="Ranking"
        subtitle="All-time totals, highest to lowest"
        right={
          <Button asChild variant="outline" size="sm">
            <Link to="/admin">Back</Link>
          </Button>
        }
      />
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-3">
        <ol className="space-y-2">
          {ranked.map((p, i) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-3 shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-12 text-lg font-bold text-center">{medal(i)}</span>
                <div className="min-w-0">
                  <Link
                    to="/admin/person/$personId"
                    params={{ personId: p.id }}
                    className="font-medium hover:underline truncate block"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs text-muted-foreground truncate">
                    {p.department_slug}
                    {p.role ? ` · ${p.role}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{p.status}</Badge>
                <span className="unicorn-text text-xl font-bold tabular-nums">
                  {p.total.toFixed(1)}
                </span>
              </div>
            </li>
          ))}
          {ranked.length === 0 && (
            <p className="text-sm text-muted-foreground">No people yet.</p>
          )}
        </ol>
      </main>
    </div>
  );
}
