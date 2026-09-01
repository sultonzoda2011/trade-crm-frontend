// Общий контракт для двух бэкендов хранилища (SQLite на Android,
// IndexedDB на вебе/Electron/Vercel-деплое). Оба стора key-value:
// используем это и для read-кэша (getAll и т.п.), и для очереди мутаций —
// у каждого свой namespace (store), но операции одинаковые.
export interface KvStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  /** Все ключи (опционально с префиксом) — нужно для перечисления очереди. */
  keys(prefix?: string): Promise<string[]>;
}
