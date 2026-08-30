import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from '@capacitor-community/sqlite';
import { SCHEMA_SQL, type StorageAdapter } from '@trade-crm/offline-core';

const DB_NAME = 'trade_crm';

/**
 * Реализация StorageAdapter поверх @capacitor-community/sqlite — реальный
 * файл SQLite на устройстве (Android/iOS), не in-memory и не веб-эмуляция.
 */
export class CapacitorSqliteStorageAdapter implements StorageAdapter {
  private connection: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;

  constructor() {
    this.connection = new SQLiteConnection(CapacitorSQLite);
  }

  async init(): Promise<void> {
    const ret = await this.connection.checkConnectionsConsistency();
    const isConn = (await this.connection.isConnection(DB_NAME, false)).result;

    this.db =
      ret.result && isConn
        ? await this.connection.retrieveConnection(DB_NAME, false)
        : await this.connection.createConnection(DB_NAME, false, 'no-encryption', 1, false);

    await this.db.open();
    await this.db.execute(SCHEMA_SQL);
  }

  private ensureDb(): SQLiteDBConnection {
    if (!this.db) throw new Error('CapacitorSqliteStorageAdapter.init() must be called before use');
    return this.db;
  }

  async exec(sql: string, params: unknown[] = []): Promise<void> {
    await this.ensureDb().run(sql, params as any[]);
  }

  async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    const res = await this.ensureDb().query(sql, params as any[]);
    return (res.values ?? []) as T[];
  }

  async transaction(work: (tx: StorageAdapter) => Promise<void>): Promise<void> {
    const db = this.ensureDb();
    await db.beginTransaction();
    try {
      await work(this);
      await db.commitTransaction();
    } catch (err) {
      await db.rollbackTransaction();
      throw err;
    }
  }
}
