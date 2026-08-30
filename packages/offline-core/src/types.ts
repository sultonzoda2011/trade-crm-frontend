/**
 * Платформо-независимые контракты. Web/Electron/Capacitor реализуют их
 * по-своему (SQLite WASM / better-sqlite3 через IPC / capacitor-sqlite),
 * а весь остальной код (outbox, syncEngine, repos) их не различает.
 */

export interface StorageAdapter {
  /** Выполнить произвольный SQL без результата (CREATE TABLE, INSERT, UPDATE...). */
  exec(sql: string, params?: unknown[]): Promise<void>;
  /** Выполнить SELECT и получить строки. */
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  /** Несколько exec() в одной транзакции — используется в push/pull, чтобы
   *  частичный сбой не оставил базу в промежуточном состоянии. */
  transaction(work: (tx: StorageAdapter) => Promise<void>): Promise<void>;
}

export interface NetworkAdapter {
  isOnline(): boolean;
  /** Подписка на изменение статуса сети. Возвращает функцию отписки. */
  onChange(cb: (online: boolean) => void): () => void;
}

export type SyncEntity = 'products' | 'categories' | 'debtors' | 'transactions';

export type OutboxMethod = 'post' | 'patch';

export interface OutboxItem {
  id: string; // uuid самой записи очереди
  entity: SyncEntity;
  method: OutboxMethod;
  url: string; // относительный путь, напр. '/transactions' или '/transactions/:id/pay'
  localId: string; // local_id сущности, к которой относится операция
  body: unknown;
  status: 'pending' | 'syncing' | 'failed';
  error: string | null;
  createdAt: string;
}

export interface HttpClient {
  post<T>(url: string, body: unknown): Promise<T>;
  patch<T>(url: string, body: unknown): Promise<T>;
  get<T>(url: string, params?: Record<string, unknown>): Promise<T>;
}
