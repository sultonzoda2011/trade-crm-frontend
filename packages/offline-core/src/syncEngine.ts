import { LAST_SYNC_KEY } from './schema';
import { listOutbox, markFailed, markSyncing, removeFromOutbox } from './outbox';
import type { HttpClient, StorageAdapter } from './types';

interface PullResponse {
  serverTime: string;
  products: any[];
  categories: any[];
  debtors: any[];
  transactions: any[];
}

async function getLastSync(storage: StorageAdapter): Promise<string | undefined> {
  const rows = await storage.query<{ value: string }>(`SELECT value FROM sync_meta WHERE key = ?`, [LAST_SYNC_KEY]);
  return rows[0]?.value;
}

async function setLastSync(storage: StorageAdapter, value: string): Promise<void> {
  await storage.exec(
    `INSERT INTO sync_meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [LAST_SYNC_KEY, value]
  );
}

/**
 * Pull: тянет дельту с /sync/pull и апсертит в локальные таблицы по
 * server_id. Ничего не трогает в outbox — pull и push независимы.
 */
export async function pull(storage: StorageAdapter, http: HttpClient): Promise<void> {
  const since = await getLastSync(storage);
  const res = await http.get<{ data: PullResponse }>('/sync/pull', since ? { since } : undefined);
  const data = res.data;

  await storage.transaction(async (tx) => {
    for (const c of data.categories) {
      await tx.exec(
        `INSERT INTO categories (local_id, server_id, name, market_id, payload, updated_at, dirty)
         VALUES (?, ?, ?, ?, ?, ?, 0)
         ON CONFLICT(local_id) DO UPDATE SET server_id=excluded.server_id, name=excluded.name,
           market_id=excluded.market_id, payload=excluded.payload, updated_at=excluded.updated_at, dirty=0`,
        [c.id, c.id, c.name, c.marketId, JSON.stringify(c), c.updatedAt]
      );
    }
    for (const p of data.products) {
      await tx.exec(
        `INSERT INTO products (local_id, server_id, name, market_id, payload, updated_at, dirty)
         VALUES (?, ?, ?, ?, ?, ?, 0)
         ON CONFLICT(local_id) DO UPDATE SET server_id=excluded.server_id, name=excluded.name,
           market_id=excluded.market_id, payload=excluded.payload, updated_at=excluded.updated_at, dirty=0`,
        [p.id, p.id, p.name, p.marketId, JSON.stringify(p), p.updatedAt]
      );
    }
    for (const d of data.debtors) {
      await tx.exec(
        `INSERT INTO debtors (local_id, server_id, name, phone, market_id, payload, updated_at, dirty)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)
         ON CONFLICT(local_id) DO UPDATE SET server_id=excluded.server_id, name=excluded.name,
           phone=excluded.phone, market_id=excluded.market_id, payload=excluded.payload,
           updated_at=excluded.updated_at, dirty=0`,
        [d.id, d.id, d.name, d.phone, d.marketId, JSON.stringify(d), d.updatedAt]
      );
    }
    for (const t of data.transactions) {
      await tx.exec(
        `INSERT INTO transactions (local_id, server_id, payload, status, market_id, updated_at, dirty)
         VALUES (?, ?, ?, ?, ?, ?, 0)
         ON CONFLICT(local_id) DO UPDATE SET server_id=excluded.server_id, payload=excluded.payload,
           status=excluded.status, market_id=excluded.market_id, updated_at=excluded.updated_at, dirty=0`,
        [t.id, t.id, JSON.stringify(t), t.status, t.marketId, t.updatedAt]
      );
    }
  });

  await setLastSync(storage, data.serverTime);
}

export interface PushResult {
  sent: number;
  failed: number;
  errors: Array<{ outboxId: string; entity: string; message: string }>;
}

/**
 * Push: строго по порядку создания (важно — вторая продажа того же товара
 * не должна уйти раньше первой). Каждая ошибка сервера (напр. "не хватает
 * остатка") оставляет запись в outbox с текстом ошибки — юзер решает
 * вручную на странице синка, автоматического мержа тут нет.
 */
export async function push(storage: StorageAdapter, http: HttpClient): Promise<PushResult> {
  const items = (await listOutbox(storage)).filter((i) => i.status !== 'syncing');
  const result: PushResult = { sent: 0, failed: 0, errors: [] };

  for (const item of items) {
    await markSyncing(storage, item.id);
    try {
      if (item.method === 'post') {
        await http.post(item.url, item.body);
      } else {
        await http.patch(item.url, item.body);
      }
      await removeFromOutbox(storage, item.id);
      result.sent += 1;
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Unknown error';
      await markFailed(storage, item.id, String(message));
      result.failed += 1;
      result.errors.push({ outboxId: item.id, entity: item.entity, message: String(message) });
      // Продолжаем со следующими элементами (в т.ч. той же сущности) —
      // если вторая транзакция по товару не зависит от первой ошибки,
      // нет смысла блокировать всю очередь. Порядок внутри одной
      // сущности всё равно сохраняется, т.к. идём по created_at ASC.
    }
  }

  return result;
}
