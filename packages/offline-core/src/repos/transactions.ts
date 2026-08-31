import { enqueueOutbox } from '../outbox';
import { decrementProductQuantity, getProductById } from './products';
import type { StorageAdapter } from '../types';

export interface LocalTransaction {
  local_id: string;
  server_id: string | null;
  payload: string; // JSON
  status: string;
  market_id: string;
  updated_at: string;
  dirty: number;
}

interface TransactionItemInput {
  productId: string; // local_id товара
  quantity: number;
  /** Если не передана — берётся текущая локальная цена товара (для оптимистичного
   *  отображения суммы; итоговую цифру всё равно пересчитает сервер при push). */
  price?: number;
  discount?: number;
  markup?: number;
}

export interface CreateTransactionInput {
  marketId: string;
  type: 'SALE' | 'DEBT';
  paymentType: 'CASH' | 'CARD' | 'CREDIT';
  debtorId?: string;
  items: TransactionItemInput[];
}

function uuid(): string {
  return crypto.randomUUID();
}

export async function getAllTransactions<T = unknown>(
  storage: StorageAdapter,
  opts: { page?: number; limit?: number } = {}
): Promise<{ items: T[]; total: number }> {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 20;
  const total = (await storage.query<{ n: number }>(`SELECT COUNT(*) as n FROM transactions`))[0]?.n ?? 0;
  const rows = await storage.query<LocalTransaction>(
    `SELECT * FROM transactions ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
    [limit, (page - 1) * limit]
  );
  return { items: rows.map((r) => JSON.parse(r.payload) as T), total };
}

export async function getTransactionById<T = unknown>(storage: StorageAdapter, localId: string): Promise<T | null> {
  const row = await getTransactionRow(storage, localId);
  return row ? (JSON.parse(row.payload) as T) : null;
}

/** Внутренний доступ к самой строке (нужен server_id, которого нет в payload). */
async function getTransactionRow(storage: StorageAdapter, localId: string): Promise<LocalTransaction | null> {
  const rows = await storage.query<LocalTransaction>(`SELECT * FROM transactions WHERE local_id = ?`, [localId]);
  return rows[0] ?? null;
}

/**
 * Создание продажи/долга офлайн. Два эффекта:
 *  1) новая строка в transactions (dirty=1, статус посчитан локально
 *     по тем же правилам, что и на сервере: SALE+CASH/CARD => PAID,
 *     DEBT/CREDIT => ACTIVE)
 *  2) оптимистичное списание quantity в products — ПОКАЗЫВАЕМ уменьшенный
 *     остаток сразу, но source of truth остаётся сервер: если push
 *     провалится по нехватке остатка, значение поправится следующим pull.
 *     Мы намеренно не блокируем locally на "остатка не хватит" — это
 *     проверит сервер при push (см. syncEngine.push).
 */
export async function createTransactionOffline(
  storage: StorageAdapter,
  input: CreateTransactionInput
): Promise<LocalTransaction> {
  const localId = uuid();
  const now = new Date().toISOString();

  const status =
    input.type === 'SALE' && input.paymentType !== 'CREDIT'
      ? 'PAID'
      : input.type === 'DEBT' || input.paymentType === 'CREDIT'
        ? 'ACTIVE'
        : 'PARTIAL';

  const itemsWithPrice = await Promise.all(
    input.items.map(async (item) => {
      if (item.price !== undefined) return item;
      const product = await getProductById<{ price: number }>(storage, item.productId);
      return { ...item, price: product?.price ?? 0 };
    })
  );

  const payload = {
    id: localId,
    type: input.type,
    paymentType: input.paymentType,
    status,
    marketId: input.marketId,
    debtorId: input.debtorId ?? null,
    items: itemsWithPrice,
    createdAt: now,
    updatedAt: now,
    _pendingSync: true, // UI-флаг: показать бейдж "ещё не отправлено" на строке
  };

  await storage.transaction(async (tx) => {
    await tx.exec(
      `INSERT INTO transactions (local_id, server_id, payload, status, market_id, updated_at, dirty)
       VALUES (?, NULL, ?, ?, ?, ?, 1)`,
      [localId, JSON.stringify(payload), status, input.marketId, now]
    );

    for (const item of input.items) {
      await decrementProductQuantity(tx, item.productId, item.quantity);
    }
  });

  await enqueueOutbox(storage, {
    entity: 'transactions',
    method: 'post',
    url: '/transactions',
    localId,
    body: {
      type: input.type,
      paymentType: input.paymentType,
      debtorId: input.debtorId,
      items: input.items,
    },
  });

  return {
    local_id: localId,
    server_id: null,
    payload: JSON.stringify(payload),
    status,
    market_id: input.marketId,
    updated_at: now,
    dirty: 1,
  };
}

/** Оплата долга офлайн — записываем платёж в payload транзакции локально + outbox. */
/** Отменить неотправленную транзакцию: вернуть оптимистично списанный остаток,
 *  удалить локальную запись и её outbox-элемент. Используется, когда push
 *  упал (напр. "не хватает остатка") и пользователь решил не продолжать —
 *  без этого запись висела бы в outbox вечно, ретраясь с той же ошибкой. */
export async function cancelTransactionOffline(storage: StorageAdapter, localId: string): Promise<void> {
  const row = await getTransactionRow(storage, localId);
  if (!row) return;

  const payload = JSON.parse(row.payload);
  await storage.transaction(async (tx) => {
    for (const item of payload.items ?? []) {
      // Возврат остатка — минус от минуса, т.е. +quantity.
      await decrementProductQuantity(tx, item.productId, -item.quantity);
    }
    await tx.exec(`DELETE FROM transactions WHERE local_id = ?`, [localId]);
    await tx.exec(`DELETE FROM outbox WHERE local_id = ? AND entity = 'transactions'`, [localId]);
  });
}

export async function payTransactionOffline(
  storage: StorageAdapter,
  localId: string,
  request: { amount: number; note?: string }
): Promise<void> {
  const existing = await getTransactionRow(storage, localId);
  if (!existing) throw new Error(`Transaction ${localId} not found locally`);
  if (!existing.server_id) {
    // Платёж ссылается на server_id в URL — если сама транзакция ещё не
    // уехала на сервер (create ещё в outbox), у нас нет id для пути.
    // UI должен блокировать кнопку "Оплатить" для транзакций с
    // _pendingSync=true и явно объяснять "дождитесь отправки".
    throw new Error('Cannot pay a transaction that has not synced to the server yet');
  }

  const payload = JSON.parse(existing.payload);
  payload.payments = [...(payload.payments ?? []), { ...request, createdAt: new Date().toISOString() }];
  const now = new Date().toISOString();

  await storage.exec(`UPDATE transactions SET payload = ?, updated_at = ?, dirty = 1 WHERE local_id = ?`, [
    JSON.stringify(payload),
    now,
    localId,
  ]);

  await enqueueOutbox(storage, {
    entity: 'transactions',
    method: 'patch',
    url: `/transactions/${existing.server_id}/pay`,
    localId,
    body: request,
  });
}
