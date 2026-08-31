import type { StorageAdapter } from '../types';

interface UserRow {
  local_id: string;
  server_id: string | null;
  name: string;
  role: string;
  market_id: string;
  payload: string;
  updated_at: string;
}

/**
 * Единая таблица `users` покрывает и /users, и /sellers (сервер фильтрует
 * по роли, локально делаем то же самое через опцию `role`). Балансы/выплаты
 * продавца (SellerCredit) сюда не входят — это финансовая операция,
 * остаётся только-онлайн (см. repos не содержат getBalance/getCredits).
 */
export async function getAllUsers<T = unknown>(
  storage: StorageAdapter,
  opts: { search?: string; role?: string; page?: number; limit?: number } = {}
): Promise<{ items: T[]; total: number }> {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 20;

  const conditions: string[] = [];
  const params: unknown[] = [];
  if (opts.search?.trim()) {
    conditions.push('name LIKE ?');
    params.push(`%${opts.search.trim()}%`);
  }
  if (opts.role) {
    conditions.push('role = ?');
    params.push(opts.role);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const total = (
    await storage.query<{ n: number }>(`SELECT COUNT(*) as n FROM users ${where}`, params)
  )[0]?.n ?? 0;

  const rows = await storage.query<UserRow>(
    `SELECT * FROM users ${where} ORDER BY name ASC LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );

  return { items: rows.map((r) => JSON.parse(r.payload) as T), total };
}

export async function getUserById<T = unknown>(storage: StorageAdapter, localId: string): Promise<T | null> {
  const rows = await storage.query<UserRow>(`SELECT * FROM users WHERE local_id = ?`, [localId]);
  const row = rows[0];
  return row ? (JSON.parse(row.payload) as T) : null;
}
