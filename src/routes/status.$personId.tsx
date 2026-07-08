import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getSessionInfo } from "@/lib/gate.functions";
import { getPerson } from "@/lib/people.functions";
import { setStatus } from "@/lib/status.functions";
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

export const Route = createFileRoute("/status/$personId")({
  loader: async ({ params }) => {
    const s = await getSessionInfo();
    if (s.role !== "dept" && s.role !== "admin") throw redirect({ to: "/unlock" });
    const person = await getPerson({ data: { id: params.personId } });
    return { s, person };
  },
  component: StatusPage,
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function StatusPage() {
  const { person } = Route.useLoaderData();
  const router = useRouter();
  const save = useServerFn(setStatus);
  const [status, setStatusVal] = useState<string>(person.status);
  const [reason, setReason] = useState(person.status_reason ?? "");
  const [leaveStart, setLeaveStart] = useState(person.leave_start ?? todayISO());
  const [leaveDays, setLeaveDays] = useState<number>(1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      await save({
        data: {
          personId: person.id,
          status: status as any,
          reason: reason || undefined,
          leave_start: status === "on_leave" ? leaveStart : undefined,
          leave_days: status === "on_leave" ? leaveDays : undefined,
        },
      });
      setMsg("Saved.");
      if (status === "terminated" || status === "resigned") {
        setTimeout(() => router.navigate({ to: "/dashboard" }), 600);
      }
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
        subtitle="Leave / status"
        right={
          <Button variant="outline" size="sm" onClick={() => router.navigate({ to: "/dashboard" })}>
            Back
          </Button>
        }
      />
      <main className="mx-auto max-w-lg px-4 py-6">
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatusVal}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_leave">On leave</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
                <SelectItem value="resigned">Resigned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === "on_leave" && (
            <>
              <div>
                <Label>Leave start date</Label>
                <Input type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} />
              </div>
              <div>
                <Label>Duration (days)</Label>
                <Input
                  type="number"
                  min={1}
                  value={leaveDays}
                  onChange={(e) => setLeaveDays(Number(e.target.value))}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Grades for these days will auto-fill as N/A.
                </p>
              </div>
            </>
          )}

          {(status === "inactive" || status === "terminated" || status === "resigned") && (
            <div>
              <Label>Reason</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          )}

          {(status === "terminated" || status === "resigned") && (
            <p className="text-sm text-amber-600">
              This person will be moved to the admin-only vault and hidden from the dashboard.
            </p>
          )}

          {msg && <p className="text-sm">{msg}</p>}
          <Button onClick={submit} disabled={busy}>
            {busy ? "Saving…" : "Save status"}
          </Button>
        </div>
      </main>
    </div>
  );
}
