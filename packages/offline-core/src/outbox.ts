import type { OutboxItem, OutboxMethod, StorageAdapter, SyncEntity } from './types';

function uuid(): string {
  return crypto.randomUUID();
}

export async function enqueueOutbox(
  storage: StorageAdapter,
  item: { entity: SyncEntity; method: OutboxMethod; url: string; localId: string; body: unknown }
): Promise<OutboxItem> {
  const row: OutboxItem = {
    id: uuid(),
    entity: item.entity,
    method: item.method,
    url: item.url,
    localId: item.localId,
    body: item.body,
    status: 'pending',
    error: null,
    createdAt: new Date().toISOString(),
  };
  await storage.exec(
    `INSERT INTO outbox (id, entity, method, url, local_id, body, status, error, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [row.id, row.entity, row.method, row.url, row.localId, JSON.stringify(row.body), row.status, row.error, row.createdAt]
  );
  return row;
}

export async function listOutbox(storage: StorageAdapter): Promise<OutboxItem[]> {
  const rows = await storage.query<{
    id: string;
    entity: SyncEntity;
    method: OutboxMethod;
    url: string;
    local_id: string;
    body: string;
    status: OutboxItem['status'];
    error: string | null;
    created_at: string;
  }>(`SELECT * FROM outbox ORDER BY created_at ASC`);

  return rows.map((r) => ({
    id: r.id,
    entity: r.entity,
    method: r.method,
    url: r.url,
    localId: r.local_id,
    body: JSON.parse(r.body),
    status: r.status,
    error: r.error,
    createdAt: r.created_at,
  }));
}

export async function countPending(storage: StorageAdapter): Promise<number> {
  const rows = await storage.query<{ n: number }>(`SELECT COUNT(*) as n FROM outbox`);
  return rows[0]?.n ?? 0;
}

export async function markSyncing(storage: StorageAdapter, id: string): Promise<void> {
  await storage.exec(`UPDATE outbox SET status = 'syncing', error = NULL WHERE id = ?`, [id]);
}

export async function markFailed(storage: StorageAdapter, id: string, error: string): Promise<void> {
  await storage.exec(`UPDATE outbox SET status = 'failed', error = ? WHERE id = ?`, [error, id]);
}

export async function removeFromOutbox(storage: StorageAdapter, id: string): Promise<void> {
  await storage.exec(`DELETE FROM outbox WHERE id = ?`, [id]);
}

export async function resetFailedToPending(storage: StorageAdapter): Promise<void> {
  await storage.exec(`UPDATE outbox SET status = 'pending' WHERE status = 'failed'`);
}
