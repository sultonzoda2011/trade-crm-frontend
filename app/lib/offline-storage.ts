/**
 * Персистентное key-value хранилище для офлайн-кеша TanStack Query.
 *
 * На Android (native) данные пишутся в настоящую SQLite-базу через
 * @capacitor-community/sqlite — это файл в песочнице приложения, который
 * Android НЕ чистит при нехватке памяти (в отличие от WebView IndexedDB/
 * localStorage, которые система вправе стереть). Именно поэтому кеш
 * переживает даже перезапуск приложения спустя месяцы без обновления.
 *
 * В браузере (dev, обычная вкладка) используется IndexedDB — она здесь
 * только для разработки и ручного тестирования в вебе, на реальном
 * поведении Android-сборки это не сказывается.
 *
 * Паттерн — как в haptics.ts/useCapacitorNetworkStatus.ts: native-плагин
 * подключается динамическим import'ом и с фолбэком, чтобы не ронять веб.
 *
 * ВАЖНО про размер строк. Android читает результат SQLite через CursorWindow
 * (~2 МБ на окно): одна строка с JSON на несколько мегабайт просто не
 * читается. Поэтому кеш хранится НЕ одним блобом, а по строке на запрос
 * (см. query-persister.ts), а читается батчами по суммарному размеру. Для
 * этого у каждой строки есть колонка `size` — по ней батчи считаются без
 * чтения самих значений.
 */

const DB_NAME = 'tradecrm_cache';
const TABLE = 'query_cache';

/** Верхняя граница суммарного размера одного пакета (запись/чтение), в символах/байтах. */
const BATCH_BYTES = 900_000;
/** Верхняя граница числа строк в одном пакете. */
const BATCH_ROWS = 100;

export interface KeyInfo {
  key: string;
  bytes: number;
}

export interface StorageStats {
  rows: number;
  bytes: number;
}

type Entry = readonly [key: string, value: string];

interface Backend {
  getItem(key: string): Promise<string | null>;
  setMany(entries: readonly Entry[]): Promise<void>;
  removeMany(keys: readonly string[]): Promise<void>;
  getMany(keys: readonly string[]): Promise<Map<string, string>>;
  listKeys(prefix: string): Promise<KeyInfo[]>;
  clear(): Promise<void>;
  stats(): Promise<StorageStats>;
}

function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

/** Длина строки в байтах UTF-8 — без аллокации TextEncoder на каждую строку кеша. */
export function utf8Bytes(value: string): number {
  let bytes = 0;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code < 0x80) bytes += 1;
    else if (code < 0x800) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff) {
      bytes += 4; // суррогатная пара — один символ вне BMP
      i++;
    } else bytes += 3;
  }
  return bytes;
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Делит записи на пакеты, чтобы ни один вызов моста Capacitor не нёс десятки мегабайт. */
function chunkEntries(entries: readonly Entry[]): Entry[][] {
  const out: Entry[][] = [];
  let current: Entry[] = [];
  let size = 0;
  for (const entry of entries) {
    const entrySize = entry[1].length;
    if (current.length > 0 && (size + entrySize > BATCH_BYTES || current.length >= BATCH_ROWS)) {
      out.push(current);
      current = [];
      size = 0;
    }
    current.push(entry);
    size += entrySize;
  }
  if (current.length > 0) out.push(current);
  return out;
}

const placeholders = (n: number) => Array.from({ length: n }, () => '?').join(',');

// ---- Native: @capacitor-community/sqlite ----------------------------------

let sqliteDbPromise: Promise<import('@capacitor-community/sqlite').SQLiteDBConnection> | undefined;

async function getSqliteDb() {
  if (!sqliteDbPromise) {
    sqliteDbPromise = (async () => {
      const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite');
      const sqlite = new SQLiteConnection(CapacitorSQLite);

      const isConn = (await sqlite.isConnection(DB_NAME, false)).result;
      const db = isConn
        ? await sqlite.retrieveConnection(DB_NAME, false)
        : await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);

      await db.open();
      await db.execute(
        `CREATE TABLE IF NOT EXISTS ${TABLE} (
           key TEXT PRIMARY KEY NOT NULL,
           value TEXT NOT NULL,
           updated_at INTEGER NOT NULL,
           size INTEGER NOT NULL DEFAULT 0
         );`,
      );
      // База из версии с единым блобом не имеет колонки size. Если колонка
      // уже есть — SQLite ответит "duplicate column", это ожидаемо.
      try {
        await db.execute(`ALTER TABLE ${TABLE} ADD COLUMN size INTEGER NOT NULL DEFAULT 0;`);
      } catch {
        /* колонка уже существует */
      }

      return db;
    })().catch((error) => {
      // Не кешируем отказ навсегда: следующая операция попробует открыть базу заново.
      sqliteDbPromise = undefined;
      throw error;
    });
  }
  return sqliteDbPromise;
}

const nativeBackend: Backend = {
  async getItem(key) {
    const db = await getSqliteDb();
    const res = await db.query(`SELECT value FROM ${TABLE} WHERE key = ?;`, [key]);
    const row = res.values?.[0] as { value?: string } | undefined;
    return row?.value ?? null;
  },
  async setMany(entries) {
    if (entries.length === 0) return;
    const db = await getSqliteDb();
    const now = Date.now();
    for (const batch of chunkEntries(entries)) {
      await db.executeSet(
        batch.map(([key, value]) => ({
          statement: `INSERT OR REPLACE INTO ${TABLE} (key, value, updated_at, size) VALUES (?, ?, ?, ?);`,
          values: [key, value, now, utf8Bytes(value)],
        })),
        true,
      );
    }
  },
  async removeMany(keys) {
    if (keys.length === 0) return;
    const db = await getSqliteDb();
    for (const batch of chunk(keys, 200)) {
      await db.run(`DELETE FROM ${TABLE} WHERE key IN (${placeholders(batch.length)});`, [...batch]);
    }
  },
  async getMany(keys) {
    const out = new Map<string, string>();
    if (keys.length === 0) return out;
    const db = await getSqliteDb();
    for (const batch of chunk(keys, BATCH_ROWS)) {
      const res = await db.query(`SELECT key, value FROM ${TABLE} WHERE key IN (${placeholders(batch.length)});`, [
        ...batch,
      ]);
      for (const row of (res.values ?? []) as { key: string; value: string }[]) out.set(row.key, row.value);
    }
    return out;
  },
  async listKeys(prefix) {
    const db = await getSqliteDb();
    const res = await db.query(`SELECT key, size FROM ${TABLE} WHERE key >= ? AND key < ? ORDER BY key;`, [
      prefix,
      `${prefix}￿`,
    ]);
    return ((res.values ?? []) as { key: string; size: number }[]).map((row) => ({
      key: row.key,
      bytes: Number(row.size) || 0,
    }));
  },
  async clear() {
    const db = await getSqliteDb();
    await db.run(`DELETE FROM ${TABLE};`, []);
  },
  async stats() {
    const db = await getSqliteDb();
    const res = await db.query(`SELECT COUNT(*) AS rows, COALESCE(SUM(size), 0) AS bytes FROM ${TABLE};`);
    const row = (res.values?.[0] ?? {}) as { rows?: number; bytes?: number };
    return { rows: Number(row.rows) || 0, bytes: Number(row.bytes) || 0 };
  },
};

// ---- Web fallback: IndexedDB ----------------------------------------------

let idbPromise: Promise<IDBDatabase> | undefined;

function getIdb(): Promise<IDBDatabase> {
  if (!idbPromise) {
    idbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(TABLE)) {
          req.result.createObjectStore(TABLE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }).catch((error) => {
      idbPromise = undefined;
      throw error;
    });
  }
  return idbPromise;
}

function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function idbTransaction(db: IDBDatabase, mode: IDBTransactionMode, run: (store: IDBObjectStore) => void) {
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(TABLE, mode);
    run(tx.objectStore(TABLE));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

const webBackend: Backend = {
  async getItem(key) {
    const db = await getIdb();
    const value = await idbRequest(db.transaction(TABLE, 'readonly').objectStore(TABLE).get(key));
    return (value as string | undefined) ?? null;
  },
  async setMany(entries) {
    if (entries.length === 0) return;
    const db = await getIdb();
    await idbTransaction(db, 'readwrite', (store) => {
      for (const [key, value] of entries) store.put(value, key);
    });
  },
  async removeMany(keys) {
    if (keys.length === 0) return;
    const db = await getIdb();
    await idbTransaction(db, 'readwrite', (store) => {
      for (const key of keys) store.delete(key);
    });
  },
  async getMany(keys) {
    const out = new Map<string, string>();
    if (keys.length === 0) return out;
    const db = await getIdb();
    const store = db.transaction(TABLE, 'readonly').objectStore(TABLE);
    await Promise.all(
      keys.map(async (key) => {
        const value = (await idbRequest(store.get(key))) as string | undefined;
        if (value !== undefined) out.set(key, value);
      }),
    );
    return out;
  },
  async listKeys(prefix) {
    const db = await getIdb();
    const store = db.transaction(TABLE, 'readonly').objectStore(TABLE);
    const range = IDBKeyRange.bound(prefix, `${prefix}￿`);
    return new Promise<KeyInfo[]>((resolve, reject) => {
      const out: KeyInfo[] = [];
      const req = store.openCursor(range);
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) return resolve(out);
        out.push({ key: String(cursor.key), bytes: String(cursor.value).length });
        cursor.continue();
      };
      req.onerror = () => reject(req.error);
    });
  },
  async clear() {
    const db = await getIdb();
    await idbTransaction(db, 'readwrite', (store) => {
      store.clear();
    });
  },
  async stats() {
    const infos = await this.listKeys('');
    return { rows: infos.length, bytes: infos.reduce((sum, info) => sum + info.bytes, 0) };
  },
};

function backend(): Backend {
  return isNativePlatform() ? nativeBackend : webBackend;
}

const hasStorage = () => typeof window !== 'undefined';

/**
 * Единая точка входа: сама решает, native SQLite или web IndexedDB, и никогда
 * не бросает исключение — персист это оптимизация, а не источник правды, его
 * сбой не должен ронять приложение. Записывающие методы возвращают `true`,
 * только если данные реально легли в хранилище: персистеру это нужно, чтобы
 * не считать запрос сохранённым после неудачной записи.
 */
export const offlineStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (!hasStorage()) return null;
      return await backend().getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<boolean> {
    return this.setMany([[key, value]]);
  },
  async removeItem(key: string): Promise<boolean> {
    return this.removeMany([key]);
  },
  async setMany(entries: readonly Entry[]): Promise<boolean> {
    try {
      if (!hasStorage()) return false;
      await backend().setMany(entries);
      return true;
    } catch {
      return false;
    }
  },
  async removeMany(keys: readonly string[]): Promise<boolean> {
    try {
      if (!hasStorage()) return false;
      await backend().removeMany(keys);
      return true;
    } catch {
      return false;
    }
  },
  /** Читает значения пакетами, чтобы суммарный размер одного ответа не превысил окно курсора Android. */
  async getMany(keys: readonly string[]): Promise<Map<string, string>> {
    try {
      if (!hasStorage()) return new Map();
      return await backend().getMany(keys);
    } catch {
      return new Map();
    }
  },
  /** Ключи с префиксом и размер каждого значения — без чтения самих значений. */
  async listKeys(prefix: string): Promise<KeyInfo[]> {
    try {
      if (!hasStorage()) return [];
      return await backend().listKeys(prefix);
    } catch {
      return [];
    }
  },
  async clear(): Promise<boolean> {
    try {
      if (!hasStorage()) return false;
      await backend().clear();
      return true;
    } catch {
      return false;
    }
  },
  async stats(): Promise<StorageStats> {
    try {
      if (!hasStorage()) return { rows: 0, bytes: 0 };
      return await backend().stats();
    } catch {
      return { rows: 0, bytes: 0 };
    }
  },
  /** Верхняя граница суммарного размера значений для одного вызова `getMany`. */
  BATCH_BYTES,
};
