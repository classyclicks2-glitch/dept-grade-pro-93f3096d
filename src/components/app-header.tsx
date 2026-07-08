import { Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { lock } from "@/lib/gate.functions";
import { Button } from "@/components/ui/button";

export function AppHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  const doLock = useServerFn(lock);
  return (
    <header className="border-b bg-card">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-4">
        <div>
          <Link to="/" className="text-lg font-semibold hover:underline">
            {title}
          </Link>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {right}
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await doLock({});
              router.navigate({ to: "/unlock" });
            }}
          >
            Lock
          </Button>
        </div>
      </div>
    </header>
  );
}
