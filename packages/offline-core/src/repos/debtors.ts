import { enqueueOutbox } from '../outbox';
import type { StorageAdapter } from '../types';

interface DebtorRow {
  local_id: string;
  server_id: string | null;
  name: string;
  phone: string;
  market_id: string;
  payload: string;
  updated_at: string;
  dirty: number;
}

function uuid(): string {
  return crypto.randomUUID();
}

export async function getAllDebtors<T = unknown>(
  storage: StorageAdapter,
  opts: { search?: string; page?: number; limit?: number } = {}
): Promise<{ items: T[]; total: number }> {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 20;
  const search = opts.search?.trim();

  const where = search ? `WHERE name LIKE ? OR phone LIKE ?` : '';
  const params = search ? [`%${search}%`, `%${search}%`] : [];

  const total = (
    await storage.query<{ n: number }>(`SELECT COUNT(*) as n FROM debtors ${where}`, params)
  )[0]?.n ?? 0;

  const rows = await storage.query<DebtorRow>(
    `SELECT * FROM debtors ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );

  return { items: rows.map((r) => JSON.parse(r.payload) as T), total };
}

export async function getDebtorById<T = unknown>(storage: StorageAdapter, localId: string): Promise<T | null> {
  const rows = await storage.query<DebtorRow>(`SELECT * FROM debtors WHERE local_id = ?`, [localId]);
  const row = rows[0];
  return row ? (JSON.parse(row.payload) as T) : null;
}

/**
 * Создание должника офлайн: local_id используется и как id, и как payload.id
 * — до следующего pull все агрегаты (сумма долга и т.д.) на нём будут
 * нулевыми, сервер досчитает их после того, как запись приедет и вернётся
 * обратно с реальными данными.
 */
export async function createDebtorOffline<T = unknown>(
  storage: StorageAdapter,
  marketId: string,
  request: { name: string; phone: string }
): Promise<T> {
  const localId = uuid();
  const now = new Date().toISOString();
  const payload = {
    id: localId,
    name: request.name,
    phone: request.phone,
    marketId,
    createdAt: now,
    updatedAt: now,
    _pendingSync: true,
  };

  await storage.exec(
    `INSERT INTO debtors (local_id, server_id, name, phone, market_id, payload, updated_at, dirty)
     VALUES (?, NULL, ?, ?, ?, ?, ?, 1)`,
    [localId, request.name, request.phone, marketId, JSON.stringify(payload), now]
  );

  await enqueueOutbox(storage, {
    entity: 'debtors',
    method: 'post',
    url: '/debtors',
    localId,
    body: request,
  });

  return payload as T;
}

/** Отменить неотправленного должника (аналогично cancelTransactionOffline) —
 *  например, если создали по ошибке, а push уже упал по другой причине
 *  (напр. дубликат телефона), проще отменить, чем ретраить бесконечно. */
export async function cancelDebtorOffline(storage: StorageAdapter, localId: string): Promise<void> {
  await storage.transaction(async (tx) => {
    await tx.exec(`DELETE FROM debtors WHERE local_id = ?`, [localId]);
    await tx.exec(`DELETE FROM outbox WHERE local_id = ? AND entity = 'debtors'`, [localId]);
  });
}
