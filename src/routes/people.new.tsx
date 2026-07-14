import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getSessionInfo } from "@/lib/gate.functions";
import { addPerson } from "@/lib/people.functions";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/people/new")({
  loader: async () => {
    const s = await getSessionInfo();
    if (s.role !== "dept") throw redirect({ to: "/unlock" });
    return s;
  },
  component: NewPerson,
});

function NewPerson() {
  const s = Route.useLoaderData();
  const router = useRouter();
  const qc = useQueryClient();
  const create = useServerFn(addPerson);
  const [form, setForm] = useState({ name: "", role: "", instagram: "", email: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title={s.deptName ?? ""} subtitle="Add person" />
      <main className="mx-auto max-w-lg px-4 py-6">
        <form
          className="space-y-4 rounded-lg border bg-card p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            try {
              await create({ data: form });
              await qc.invalidateQueries({ queryKey: ["people", s.deptSlug] });
              await qc.invalidateQueries({ queryKey: ["totals", s.deptSlug] });
              router.navigate({ to: "/dashboard" });
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Role / Position">
            <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Instagram">
            <Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={busy || !form.name}>{busy ? "Saving…" : "Save"}</Button>
            <Button type="button" variant="ghost" onClick={() => router.navigate({ to: "/dashboard" })}>
              Cancel
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      {children}
    </div>
  );
}
