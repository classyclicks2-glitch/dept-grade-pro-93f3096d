// Simple localStorage-backed queue for departmental updates.
// Posts go directly when online; when offline or if the request fails,
// they're queued and flushed automatically once the network is back.

const KEY = "pending_updates_v1";

export type PendingUpdate = {
  id: string; // local id
  author_name: string;
  content: string;
  update_date?: string;
  queuedAt: number;
};

function read(): PendingUpdate[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(list: PendingUpdate[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getPending(): PendingUpdate[] {
  return read();
}

export function queueUpdate(u: Omit<PendingUpdate, "id" | "queuedAt">): PendingUpdate {
  const item: PendingUpdate = {
    ...u,
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    queuedAt: Date.now(),
  };
  write([...read(), item]);
  return item;
}

export function removePending(id: string) {
  write(read().filter((p) => p.id !== id));
}

export async function flushQueue(
  send: (u: Omit<PendingUpdate, "id" | "queuedAt">) => Promise<unknown>,
): Promise<number> {
  const items = read();
  let ok = 0;
  for (const it of items) {
    try {
      await send({ author_name: it.author_name, content: it.content, update_date: it.update_date });
      removePending(it.id);
      ok++;
    } catch {
      // stop on first failure — try again next time
      break;
    }
  }
  return ok;
}
