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
 */

const DB_NAME = 'tradecrm_cache';
const TABLE = 'query_cache';

interface AsyncStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

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
           updated_at INTEGER NOT NULL
         );`,
      );

      return db;
    })();
  }
  return sqliteDbPromise;
}

const nativeStorage: AsyncStorage = {
  async getItem(key) {
    const db = await getSqliteDb();
    const res = await db.query(`SELECT value FROM ${TABLE} WHERE key = ?;`, [key]);
    const row = res.values?.[0] as { value?: string } | undefined;
    return row?.value ?? null;
  },
  async setItem(key, value) {
    const db = await getSqliteDb();
    await db.run(`INSERT OR REPLACE INTO ${TABLE} (key, value, updated_at) VALUES (?, ?, ?);`, [
      key,
      value,
      Date.now(),
    ]);
  },
  async removeItem(key) {
    const db = await getSqliteDb();
    await db.run(`DELETE FROM ${TABLE} WHERE key = ?;`, [key]);
  },
};

// ---- Web fallback: IndexedDB ----------------------------------------------

let idbPromise: Promise<IDBDatabase> | undefined;

function getIdb(): Promise<IDBDatabase> {
  if (!idbPromise) {
    idbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(TABLE)) {
          req.result.createObjectStore(TABLE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return idbPromise;
}

const webStorage: AsyncStorage = {
  async getItem(key) {
    const db = await getIdb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TABLE, 'readonly');
      const req = tx.objectStore(TABLE).get(key);
      req.onsuccess = () => resolve((req.result as string | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  },
  async setItem(key, value) {
    const db = await getIdb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TABLE, 'readwrite');
      tx.objectStore(TABLE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  async removeItem(key) {
    const db = await getIdb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TABLE, 'readwrite');
      tx.objectStore(TABLE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};

/**
 * Единая точка входа: сама решает, native SQLite или web IndexedDB,
 * и молча падает обратно на no-op, если ни то ни другое недоступно
 * (SSR/тесты) — так же, как остальные Capacitor-обёртки в проекте.
 */
export const offlineStorage: AsyncStorage = {
  async getItem(key) {
    try {
      if (typeof window === 'undefined') return null;
      return await (isNativePlatform() ? nativeStorage : webStorage).getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key, value) {
    try {
      if (typeof window === 'undefined') return;
      await (isNativePlatform() ? nativeStorage : webStorage).setItem(key, value);
    } catch {
      // Персист — это оптимизация, а не источник правды; падение записи
      // не должно ронять приложение.
    }
  },
  async removeItem(key) {
    try {
      if (typeof window === 'undefined') return;
      await (isNativePlatform() ? nativeStorage : webStorage).removeItem(key);
    } catch {
      // см. setItem
    }
  },
};
