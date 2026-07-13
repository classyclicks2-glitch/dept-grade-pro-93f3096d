import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getSessionInfo } from "@/lib/gate.functions";
import { listPeople, listTotals } from "@/lib/people.functions";
import { listUpdates, addUpdate, deleteUpdate } from "@/lib/updates.functions";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  const fetchTotals = useServerFn(listTotals);
  const { data: people = [], isLoading } = useQuery({
    queryKey: ["people", s.deptSlug],
    queryFn: () => fetchPeople({ data: {} }),
  });
  const { data: totals = {} } = useQuery({
    queryKey: ["totals", s.deptSlug],
    queryFn: () => fetchTotals({ data: {} }),
  });

  const grandTotal = Object.values(totals).reduce((a, b) => a + (b as number), 0);

  return (
    <div className="min-h-screen">
      <AppHeader
        title={s.deptName ?? "Department"}
        subtitle="Team members"
        right={
          <Button asChild size="sm">
            <Link to="/people/new">Add person</Link>
          </Button>
        }
      />
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <div className="rounded-2xl unicorn-gradient p-6 text-white shadow-[var(--shadow-unicorn)]">
          <p className="text-sm/none opacity-90">Total marks of everyone</p>
          <p className="mt-2 text-5xl font-bold">{grandTotal.toFixed(1)}</p>
          <p className="mt-1 text-xs opacity-80">{people.length} people · all-time sum</p>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : people.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center bg-card">
            <p className="text-muted-foreground">No people yet in this department.</p>
            <Button asChild className="mt-4">
              <Link to="/people/new">Add first person</Link>
            </Button>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {people.map((p) => (
              <li key={p.id} className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    {p.role && <p className="text-sm text-muted-foreground">{p.role}</p>}
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground">Total</span>
                  <span className="unicorn-text text-2xl font-bold">
                    {(totals[p.id] ?? 0).toFixed(1)}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
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

        <DepartmentalUpdates deptSlug={s.deptSlug!} />
      </main>
    </div>
  );
}

function DepartmentalUpdates({ deptSlug }: { deptSlug: string }) {
  const qc = useQueryClient();
  const fetchUpdates = useServerFn(listUpdates);
  const addFn = useServerFn(addUpdate);
  const delFn = useServerFn(deleteUpdate);
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState<Date>(new Date());

  const { data: updates = [], isLoading } = useQuery({
    queryKey: ["updates", deptSlug],
    queryFn: () => fetchUpdates({ data: {} }),
  });

  const add = useMutation({
    mutationFn: (vars: { author_name: string; content: string; update_date?: string }) =>
      addFn({ data: vars }),
    onSuccess: () => {
      setContent("");
      qc.invalidateQueries({ queryKey: ["updates", deptSlug] });
      toast.success("Update posted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["updates", deptSlug] }),
  });

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm">
      <h2 className="text-lg font-semibold unicorn-text">📝 Departmental updates</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Post what your team did. Pick the date it applies to. Admin can see all departments' updates.
      </p>

      <form
        className="mt-4 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!author.trim() || !content.trim()) return;
          add.mutate({
            author_name: author.trim(),
            content: content.trim(),
            update_date: format(date, "yyyy-MM-dd"),
          });
        }}
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Your name"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            maxLength={120}
            required
            className="sm:flex-1"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn("sm:w-[200px] justify-start text-left font-normal")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
        <Textarea
          placeholder="Update for the selected date…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={2000}
          rows={3}
          required
        />
        <Button type="submit" size="sm" disabled={add.isPending}>
          {add.isPending ? "Posting…" : "Post update"}
        </Button>
      </form>

      <div className="mt-5 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && updates.length === 0 && (
          <p className="text-sm text-muted-foreground">No updates yet.</p>
        )}
        {updates.map((u) => (
          <div key={u.id} className="rounded-lg border bg-background/50 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">{u.author_name}</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {new Date(u.created_at).toLocaleString()}
                </p>
                <button
                  onClick={() => del.mutate(u.id)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                  aria-label="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm">{u.content}</p>
          </div>
        ))}
      </div>
    </section>
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
