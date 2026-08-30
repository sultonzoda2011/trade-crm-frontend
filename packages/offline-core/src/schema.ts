/**
 * Общая схема локальной SQLite для всех платформ. local_id — стабильный
 * UUID, генерируется на клиенте и не меняется. server_id — null, пока
 * запись не уехала на сервер и не вернулась через push/pull.
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS categories (
  local_id TEXT PRIMARY KEY,
  server_id TEXT,
  name TEXT NOT NULL,
  market_id TEXT NOT NULL,
  payload TEXT NOT NULL, -- полный JSON категории, как отдаёт сервер
  updated_at TEXT NOT NULL,
  dirty INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  local_id TEXT PRIMARY KEY,
  server_id TEXT,
  name TEXT NOT NULL,
  market_id TEXT NOT NULL,
  payload TEXT NOT NULL, -- полный JSON товара (включая market/category/metrics)
  updated_at TEXT NOT NULL,
  dirty INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS debtors (
  local_id TEXT PRIMARY KEY,
  server_id TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  market_id TEXT NOT NULL,
  payload TEXT NOT NULL, -- полный JSON должника
  updated_at TEXT NOT NULL,
  dirty INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS transactions (
  local_id TEXT PRIMARY KEY,
  server_id TEXT,
  payload TEXT NOT NULL, -- полный JSON транзакции (items/payments/...)
  status TEXT NOT NULL,
  market_id TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  dirty INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY,
  entity TEXT NOT NULL,
  method TEXT NOT NULL,
  url TEXT NOT NULL,
  local_id TEXT NOT NULL,
  body TEXT NOT NULL, -- JSON
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

export const LAST_SYNC_KEY = 'last_sync_at';
