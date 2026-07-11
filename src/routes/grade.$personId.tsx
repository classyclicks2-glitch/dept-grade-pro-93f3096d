import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getSessionInfo } from "@/lib/gate.functions";
import { getPerson } from "@/lib/people.functions";
import { getGrade, saveGrade } from "@/lib/grades.functions";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/grade/$personId")({
  loader: async ({ params }) => {
    const s = await getSessionInfo();
    if (s.role !== "dept" && s.role !== "admin") throw redirect({ to: "/unlock" });
    const person = await getPerson({ data: { id: params.personId } });
    return { s, person };
  },
  component: GradePage,
});

const TASKS = [
  { key: "dept", label: "Departmental Task" },
  { key: "da", label: "Delegate Affairs Task" },
  { key: "mkt", label: "Marketing Task" },
  { key: "hr", label: "HR Task" },
] as const;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function GradePage() {
  const { s, person } = Route.useLoaderData();
  const router = useRouter();
  const qc = useQueryClient();
  const fetchGrade = useServerFn(getGrade);
  const save = useServerFn(saveGrade);
  const [date, setDate] = useState(todayISO());
  const [form, setForm] = useState<any>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const { data: existing, refetch } = useQuery({
    queryKey: ["grade", person.id, date],
    queryFn: () => fetchGrade({ data: { personId: person.id, date } }),
  });

  useEffect(() => {
    setForm(existing ?? {});
    setMsg(null);
  }, [existing, date]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const isOnLeave = person.status === "on_leave" && date >= (person.leave_start ?? "") && date <= (person.leave_end ?? "");

  const dayTotal =
    (Number(form.dept_task_grade) || 0) +
    (Number(form.da_task_grade) || 0) +
    (Number(form.mkt_task_grade) || 0) +
    (Number(form.hr_task_grade) || 0) +
    (Number(form.ethics_grade) || 0) +
    (Number(form.other_grade) || 0);

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      await save({
        data: {
          personId: person.id,
          date,
          dept_task_detail: form.dept_task_detail ?? null,
          dept_task_grade: numOrNull(form.dept_task_grade),
          da_task_detail: form.da_task_detail ?? null,
          da_task_grade: numOrNull(form.da_task_grade),
          mkt_task_detail: form.mkt_task_detail ?? null,
          mkt_task_grade: numOrNull(form.mkt_task_grade),
          hr_task_detail: form.hr_task_detail ?? null,
          hr_task_grade: numOrNull(form.hr_task_grade),
          ethics: form.ethics ?? undefined,
          ethics_grade: numOrNull(form.ethics_grade),
          ethics_comment: form.ethics_comment ?? null,
          other_remarks: form.other_remarks ?? null,
          other_grade: numOrNull(form.other_grade),
        },
      });
      await qc.invalidateQueries({ queryKey: ["grade", person.id, date] });
      await qc.invalidateQueries({ queryKey: ["totals"] });
      await qc.invalidateQueries({ queryKey: ["admin", "totals"] });
      const savedTotal = dayTotal;
      setMsg(`Mark added · today's total ${savedTotal.toFixed(1)}`);
      router.navigate({ to: "/dashboard" });
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title={person.name}
        subtitle={person.role ?? undefined}
        right={
          <Button variant="outline" size="sm" onClick={() => router.navigate({ to: "/dashboard" })}>
            Back
          </Button>
        }
      />
      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        <div className="rounded-lg border bg-card p-4">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
          {isOnLeave && (
            <p className="mt-2 text-sm text-amber-600">
              This person is on leave for this date — grades were auto-filled as N/A. You can still edit.
            </p>
          )}
        </div>

        {TASKS.map((t) => (
          <section key={t.key} className="rounded-lg border bg-card p-4 space-y-3">
            <h2 className="font-semibold">{t.label}</h2>
            <Textarea
              placeholder="Details of the task"
              value={form[`${t.key}_task_detail`] ?? ""}
              onChange={(e) => set(`${t.key}_task_detail`, e.target.value)}
            />
            <div>
              <Label>Grade</Label>
              <Input
                type="number"
                step="0.1"
                value={form[`${t.key}_task_grade`] ?? ""}
                onChange={(e) => set(`${t.key}_task_grade`, e.target.value)}
              />
            </div>
          </section>
        ))}

        <section className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="font-semibold">Ethics</h2>
          <Select
            value={form.ethics ?? ""}
            onValueChange={(v) => {
              set("ethics", v);
              if (v === "good") set("ethics_grade", 1);
              else if (v === "na") set("ethics_grade", 0);
              else set("ethics_grade", "");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="good">Good (+1)</SelectItem>
              <SelectItem value="bad">Bad</SelectItem>
              <SelectItem value="na">N/A (0)</SelectItem>
            </SelectContent>
          </Select>
          {form.ethics === "bad" && (
            <div>
              <Label>Negative mark</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g. -1"
                value={form.ethics_grade ?? ""}
                onChange={(e) => set("ethics_grade", e.target.value)}
              />
            </div>
          )}
          <Textarea
            placeholder="Comment"
            value={form.ethics_comment ?? ""}
            onChange={(e) => set("ethics_comment", e.target.value)}
          />
        </section>

        <section className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="font-semibold">Other remarks</h2>
          <Textarea
            placeholder="Comment"
            value={form.other_remarks ?? ""}
            onChange={(e) => set("other_remarks", e.target.value)}
          />
          <div>
            <Label>Grade</Label>
            <Input
              type="number"
              step="0.1"
              value={form.other_grade ?? ""}
              onChange={(e) => set("other_grade", e.target.value)}
            />
          </div>
        </section>

        <div className="rounded-2xl unicorn-gradient p-4 text-white shadow-[var(--shadow-unicorn)] flex items-center justify-between">
          <span className="text-sm opacity-90">Total for {date}</span>
          <span className="text-2xl font-bold">{dayTotal.toFixed(1)}</span>
        </div>
        {msg && <p className="text-sm font-medium text-primary">{msg}</p>}
        <div className="flex gap-2">
          <Button onClick={submit} disabled={busy}>
            {busy ? "Saving…" : "Save grade"}
          </Button>
        </div>
      </main>
    </div>
  );
}

function numOrNull(v: any): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
