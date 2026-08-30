import type { StorageAdapter } from '../types';

interface CategoryRow {
  local_id: string;
  server_id: string | null;
  name: string;
  market_id: string;
  payload: string;
  updated_at: string;
}

/** Категории офлайн — только справочник для формы товара, создание/правка только онлайн. */
export async function getAllCategories<T = unknown>(
  storage: StorageAdapter,
  opts: { search?: string } = {}
): Promise<T[]> {
  const search = opts.search?.trim();
  const rows = search
    ? await storage.query<CategoryRow>(`SELECT * FROM categories WHERE name LIKE ? ORDER BY name`, [`%${search}%`])
    : await storage.query<CategoryRow>(`SELECT * FROM categories ORDER BY name`);
  return rows.map((r) => JSON.parse(r.payload) as T);
}
