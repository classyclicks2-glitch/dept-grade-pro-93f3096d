import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getSessionInfo } from "@/lib/gate.functions";
import { listUpdates } from "@/lib/updates.functions";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/updates")({
  loader: async () => {
    const s = await getSessionInfo();
    if (s.role !== "admin") throw redirect({ to: "/unlock" });
    return s;
  },
  component: AdminUpdates,
});

const DEPTS = [
  { slug: "delegate_affairs", name: "Delegate Affairs" },
  { slug: "marketing", name: "Marketing" },
  { slug: "hr", name: "HR" },
  { slug: "academics", name: "Academics" },
  { slug: "corporate_affairs", name: "Corporate Affairs" },
];

function AdminUpdates() {
  const [active, setActive] = useState<string>(DEPTS[0].slug);
  const fetchUpdates = useServerFn(listUpdates);
  const { data: updates = [], isLoading } = useQuery({
    queryKey: ["admin", "updates", active],
    queryFn: () => fetchUpdates({ data: { deptSlug: active, limit: 200 } }),
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  return (
    <div className="min-h-screen">
      <AppHeader
        title="Departmental Updates"
        subtitle="Daily notes by department"
        right={
          <Button asChild variant="outline" size="sm">
            <Link to="/admin">Back</Link>
          </Button>
        }
      />
      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <div className="flex flex-wrap gap-2">
          {DEPTS.map((d) => (
            <Button
              key={d.slug}
              size="sm"
              variant={active === d.slug ? "default" : "outline"}
              onClick={() => setActive(d.slug)}
            >
              {d.name}
            </Button>
          ))}
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && updates.length === 0 && (
          <div className="rounded-2xl border border-dashed p-10 text-center bg-card">
            <p className="text-muted-foreground">No updates from this department yet.</p>
          </div>
        )}

        <ul className="space-y-3">
          {updates.map((u) => (
            <li key={u.id} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{u.author_name}</p>
                  <p className="text-xs text-muted-foreground">
                    For {new Date(u.update_date + "T00:00:00").toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Posted {new Date(u.created_at).toLocaleString()}
                </p>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{u.content}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
