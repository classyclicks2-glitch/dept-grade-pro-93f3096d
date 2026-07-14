// Simple localStorage-backed drafts for departmental updates.
// Offline posts stay on the device, then sync once the app is online again.

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
): Promise<{ synced: number; failed: number }> {
  const items = read();
  let synced = 0;
  let failed = 0;
  for (const it of items) {
    try {
      await send({ author_name: it.author_name, content: it.content, update_date: it.update_date });
      removePending(it.id);
      synced++;
    } catch {
      failed++;
      // stop on first failure — keep remaining drafts and try again next time
      break;
    }
  }
  return { synced, failed };
}
