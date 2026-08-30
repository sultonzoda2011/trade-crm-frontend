import type { StorageAdapter } from '../types';

interface ProductRow {
  local_id: string;
  server_id: string | null;
  name: string;
  market_id: string;
  payload: string; // JSON — форма 1:1 с ответом сервера (Product type на фронте)
  updated_at: string;
  dirty: number;
}

/**
 * Возвращает распарсенный payload (сырой JSON от сервера), а не отдельные
 * поля — так локальная выдача 1:1 совпадает с тем, что ждёт фронтенд
 * (типы Product/ProductDetail), без отдельного маппинга под каждую платформу.
 */
export async function getAllProducts<T = unknown>(
  storage: StorageAdapter,
  opts: { search?: string; page?: number; limit?: number } = {}
): Promise<{ items: T[]; total: number }> {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 20;
  const search = opts.search?.trim();

  const where = search ? `WHERE name LIKE ?` : '';
  const params = search ? [`%${search}%`] : [];

  const total = (
    await storage.query<{ n: number }>(`SELECT COUNT(*) as n FROM products ${where}`, params)
  )[0]?.n ?? 0;

  const rows = await storage.query<ProductRow>(
    `SELECT * FROM products ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );

  return { items: rows.map((r) => JSON.parse(r.payload) as T), total };
}

export async function getProductById<T = unknown>(storage: StorageAdapter, localId: string): Promise<T | null> {
  const rows = await storage.query<ProductRow>(`SELECT * FROM products WHERE local_id = ?`, [localId]);
  const row = rows[0];
  return row ? (JSON.parse(row.payload) as T) : null;
}

/**
 * Оптимистичное списание остатка при офлайн-продаже (см.
 * repos/transactions.ts::createTransactionOffline). Правим прямо JSON
 * payload, т.к. quantity живёт внутри него, а не отдельной колонкой.
 */
export async function decrementProductQuantity(storage: StorageAdapter, localId: string, by: number): Promise<void> {
  const rows = await storage.query<ProductRow>(`SELECT * FROM products WHERE local_id = ?`, [localId]);
  const row = rows[0];
  if (!row) return;
  const payload = JSON.parse(row.payload);
  payload.quantity = (payload.quantity ?? 0) - by;
  const now = new Date().toISOString();
  await storage.exec(`UPDATE products SET payload = ?, updated_at = ? WHERE local_id = ?`, [
    JSON.stringify(payload),
    now,
    localId,
  ]);
}
