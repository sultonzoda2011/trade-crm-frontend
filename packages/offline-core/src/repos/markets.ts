import type { StorageAdapter } from '../types';

interface MarketRow {
  local_id: string;
  server_id: string | null;
  name: string;
  payload: string;
  updated_at: string;
}

/** У продавца/владельца офлайн есть доступ только к своему маркету — не к списку всех. */
export async function getOwnMarket<T = unknown>(storage: StorageAdapter): Promise<T | null> {
  const rows = await storage.query<MarketRow>(`SELECT * FROM markets LIMIT 1`);
  const row = rows[0];
  return row ? (JSON.parse(row.payload) as T) : null;
}

export async function getMarketById<T = unknown>(storage: StorageAdapter, localId: string): Promise<T | null> {
  const rows = await storage.query<MarketRow>(`SELECT * FROM markets WHERE local_id = ?`, [localId]);
  const row = rows[0];
  return row ? (JSON.parse(row.payload) as T) : null;
}
