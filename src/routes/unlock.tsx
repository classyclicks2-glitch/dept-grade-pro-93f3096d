import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { unlock } from "@/lib/gate.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/unlock")({
  component: UnlockPage,
});

function UnlockPage() {
  const router = useRouter();
  const doUnlock = useServerFn(unlock);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [choices, setChoices] = useState<{ slug: string; name: string }[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(deptSlug?: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await doUnlock({ data: { password, deptSlug } });
      if (!res.ok) {
        setError("Incorrect password.");
        return;
      }
      if (res.role === "choose") {
        setChoices(res.options);
        return;
      }
      await router.invalidate();
      if (res.role === "admin") router.navigate({ to: "/admin" });
      else router.navigate({ to: "/dashboard" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border bg-card p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold">Enter password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your department password unlocks grading. Admin password opens the admin panel.
          </p>
        </div>

        {!choices ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <Input
              type="password"
              inputMode="numeric"
              autoFocus
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy || !password}>
              {busy ? "Checking…" : "Continue"}
            </Button>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-sm">
              That password unlocks multiple departments. Which are you grading for?
            </p>
            {choices.map((c) => (
              <Button
                key={c.slug}
                variant="outline"
                className="w-full justify-start"
                disabled={busy}
                onClick={() => submit(c.slug)}
              >
                {c.name}
              </Button>
            ))}
            <button
              className="text-xs text-muted-foreground underline"
              onClick={() => {
                setChoices(null);
                setPassword("");
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
