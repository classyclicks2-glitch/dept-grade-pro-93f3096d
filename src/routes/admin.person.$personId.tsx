import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { getSessionInfo } from "@/lib/gate.functions";
import { getPerson, listTotals } from "@/lib/people.functions";
import { listGrades, adminEditGrade } from "@/lib/grades.functions";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/person/$personId")({
  loader: async ({ params }) => {
    const s = await getSessionInfo();
    if (s.role !== "admin") throw redirect({ to: "/unlock" });
    const person = await getPerson({ data: { id: params.personId } });
    return { person };
  },
  component: AdminPerson,
});

function monthRange(monthISO: string) {
  const [y, m] = monthISO.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const last = new Date(Date.UTC(y, m, 0));
  const dates: string[] = [];
  for (let d = 1; d <= last.getUTCDate(); d++) {
    dates.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return {
    from: dates[0],
    to: dates[dates.length - 1],
    dates,
  };
}

const GRADE_FIELDS = [
  { key: "dept_task_grade", label: "Dept" },
  { key: "da_task_grade", label: "DA" },
  { key: "mkt_task_grade", label: "MKT" },
  { key: "hr_task_grade", label: "HR" },
  { key: "ethics_grade", label: "Ethics" },
  { key: "other_grade", label: "Other" },
  { key: "hod_grade", label: "HOD" },
] as const;

function sumRow(r: any): number {
  return GRADE_FIELDS.slice(0, 6).reduce((s, f) => s + (Number(r?.[f.key]) || 0), 0);
}

function AdminPerson() {
  const { person } = Route.useLoaderData();
  const qc = useQueryClient();
  const fetchGrades = useServerFn(listGrades);
  const fetchTotals = useServerFn(listTotals);
  const editFn = useServerFn(adminEditGrade);

  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const { from, to, dates } = useMemo(() => monthRange(month), [month]);
  const { data: grades = [] } = useQuery({
    queryKey: ["admin", "grades", person.id, from, to],
    queryFn: () => fetchGrades({ data: { personId: person.id, from, to } }),
  });
  const { data: totals = {} } = useQuery({
    queryKey: ["admin", "totals"],
    queryFn: () => fetchTotals({ data: {} }),
  });
  const allTime = (totals as Record<string, number>)[person.id] ?? 0;

  const byDate = new Map<string, any>();
  for (const g of grades) byDate.set(g.date, g);

  const [editing, setEditing] = useState<string | null>(null);
  const overall = grades.reduce((s, r) => s + sumRow(r), 0);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title={person.name}
        subtitle={`${person.department_slug} · ${month} total ${overall}`}
        right={
          <Button asChild variant="outline" size="sm">
            <Link to="/admin">Back</Link>
          </Button>
        }
      />
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-4">
        <div className="rounded-2xl unicorn-gradient p-6 text-white shadow-[var(--shadow-unicorn)]">
          <p className="text-sm opacity-90">All-time total marks (incl. HOD)</p>
          <p className="mt-2 text-5xl font-bold">{allTime.toFixed(0)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Label>Month</Label>
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-40"
          />
        </div>

        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-2 text-left">Date</th>
                {GRADE_FIELDS.map((f) => (
                  <th key={f.key} className="p-2">{f.label}</th>
                ))}
                <th className="p-2">Total</th>
                <th className="p-2">HOD Remarks</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {dates.map((d) => {
                const row = byDate.get(d);
                return (
                  <tr key={d} className="border-t">
                    <td className="p-2 whitespace-nowrap">{d}</td>
                    {GRADE_FIELDS.map((f) => (
                      <td key={f.key} className="p-2 text-center tabular-nums">
                        {row?.[f.key] ?? "—"}
                      </td>
                    ))}
                    <td className="p-2 text-center font-medium">{row ? sumRow(row) : "—"}</td>
                    <td className="p-2 max-w-[180px] truncate text-muted-foreground">
                      {row?.hod_remarks ?? ""}
                    </td>
                    <td className="p-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(d)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {editing && (
        <EditDialog
          personId={person.id}
          date={editing}
          existing={byDate.get(editing)}
          onClose={() => setEditing(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["admin", "grades", person.id] });
            setEditing(null);
          }}
          save={editFn}
        />
      )}
    </div>
  );
}

function EditDialog({
  personId,
  date,
  existing,
  onClose,
  onSaved,
  save,
}: {
  personId: string;
  date: string;
  existing: any;
  onClose: () => void;
  onSaved: () => void;
  save: any;
}) {
  const [f, setF] = useState<any>(existing ?? {});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));
  const num = (v: any) => (v === "" || v == null ? null : Math.round(Number(v)));

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      await save({
        data: {
          personId,
          date,
          dept_task_detail: f.dept_task_detail ?? null,
          dept_task_grade: num(f.dept_task_grade),
          da_task_detail: f.da_task_detail ?? null,
          da_task_grade: num(f.da_task_grade),
          mkt_task_detail: f.mkt_task_detail ?? null,
          mkt_task_grade: num(f.mkt_task_grade),
          hr_task_detail: f.hr_task_detail ?? null,
          hr_task_grade: num(f.hr_task_grade),
          ethics: f.ethics ?? undefined,
          ethics_grade: num(f.ethics_grade),
          ethics_comment: f.ethics_comment ?? null,
          other_remarks: f.other_remarks ?? null,
          other_grade: num(f.other_grade),
          hod_remarks: f.hod_remarks ?? null,
          hod_grade: num(f.hod_grade),
        },
      });
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const rows: [string, string, string][] = [
    ["dept_task", "Dept task", "dept"],
    ["da_task", "DA task", "da"],
    ["mkt_task", "MKT task", "mkt"],
    ["hr_task", "HR task", "hr"],
  ];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {date}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {rows.map(([base, label, prefix]) => (
            <div key={base} className="space-y-1">
              <Label>{label}</Label>
              <Textarea
                rows={2}
                value={f[`${prefix}_task_detail`] ?? ""}
                onChange={(e) => set(`${prefix}_task_detail`, e.target.value)}
              />
              <Input
                type="number"
                step="1"
                placeholder="grade"
                value={f[`${prefix}_task_grade`] ?? ""}
                onChange={(e) => set(`${prefix}_task_grade`, e.target.value)}
              />
            </div>
          ))}
          <div className="space-y-1">
            <Label>Ethics</Label>
            <Select value={f.ethics ?? ""} onValueChange={(v) => set("ethics", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="bad">Bad</SelectItem>
                <SelectItem value="na">N/A</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              step="1"
              placeholder="ethics grade"
              value={f.ethics_grade ?? ""}
              onChange={(e) => set("ethics_grade", e.target.value)}
            />
            <Textarea
              rows={2}
              placeholder="ethics comment"
              value={f.ethics_comment ?? ""}
              onChange={(e) => set("ethics_comment", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Other remarks</Label>
            <Textarea
              rows={2}
              value={f.other_remarks ?? ""}
              onChange={(e) => set("other_remarks", e.target.value)}
            />
            <Input
              type="number"
              step="1"
              placeholder="other grade"
              value={f.other_grade ?? ""}
              onChange={(e) => set("other_grade", e.target.value)}
            />
          </div>
          <div className="space-y-1 rounded-md border p-3 bg-muted/50">
            <Label>HOD Remarks (admin only)</Label>
            <Textarea
              rows={2}
              value={f.hod_remarks ?? ""}
              onChange={(e) => set("hod_remarks", e.target.value)}
            />
            <Input
              type="number"
              step="1"
              placeholder="HOD grade"
              value={f.hod_grade ?? ""}
              onChange={(e) => set("hod_grade", e.target.value)}
            />
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
