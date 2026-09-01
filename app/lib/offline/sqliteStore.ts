import type { KvStore } from './kvStore';

// SQLite-реализация KvStore — только для нативного Android (Capacitor).
// Один общий connection на всё приложение, две логические таблицы
// создаются lazily при первом обращении к каждому namespace.
//
// Импорт @capacitor-community/sqlite делаем динамически (см. platform.ts) —
// на веб/Electron-сборках этот модуль не должен попадать в бандл рантайма.
let sqlitePromise: Promise<import('@capacitor-community/sqlite').SQLiteDBConnection> | null = null;
const ensuredTables = new Set<string>();

async function getConnection() {
  if (!sqlitePromise) {
    sqlitePromise = (async () => {
      const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite');
      const sqlite = new SQLiteConnection(CapacitorSQLite);
      const isConsistent = (await sqlite.checkConnectionsConsistency()).result;
      const isOpen = (await sqlite.isConnection('trade_crm_offline', false)).result;

      const db =
        isConsistent && isOpen
          ? await sqlite.retrieveConnection('trade_crm_offline', false)
          : await sqlite.createConnection('trade_crm_offline', false, 'no-encryption', 1, false);

      await db.open();
      return db;
    })();
  }
  return sqlitePromise;
}

async function ensureTable(namespace: string) {
  if (ensuredTables.has(namespace)) return;
  const db = await getConnection();
  // namespace приходит только из наших же вызовов (не от пользователя),
  // так что подстановка имени таблицы безопасна.
  await db.execute(
    `CREATE TABLE IF NOT EXISTS kv_${namespace} (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL);`
  );
  ensuredTables.add(namespace);
}

export function createSqliteStore(namespace: string): KvStore {
  const table = `kv_${namespace}`;

  return {
    async get(key) {
      await ensureTable(namespace);
      const db = await getConnection();
      const res = await db.query(`SELECT value FROM ${table} WHERE key = ?;`, [key]);
      return res.values?.[0]?.value ?? null;
    },

    async set(key, value) {
      await ensureTable(namespace);
      const db = await getConnection();
      await db.run(`INSERT OR REPLACE INTO ${table} (key, value, updated_at) VALUES (?, ?, ?);`, [
        key,
        value,
        Date.now(),
      ]);
    },

    async delete(key) {
      await ensureTable(namespace);
      const db = await getConnection();
      await db.run(`DELETE FROM ${table} WHERE key = ?;`, [key]);
    },

    async keys(prefix) {
      await ensureTable(namespace);
      const db = await getConnection();
      const res = prefix
        ? await db.query(`SELECT key FROM ${table} WHERE key LIKE ?;`, [`${prefix}%`])
        : await db.query(`SELECT key FROM ${table};`);
      return (res.values ?? []).map((row) => row.key as string);
    },
  };
}
