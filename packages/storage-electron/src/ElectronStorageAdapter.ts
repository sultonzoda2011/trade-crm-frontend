import type { StorageAdapter } from '@trade-crm/offline-core';

/**
 * Реальная работа с SQLite (better-sqlite3) идёт в main-процессе Electron —
 * это Node-контекст, renderer к нему прямого доступа не имеет (contextIsolation:
 * true, nodeIntegration: false, как и должно быть по соображениям безопасности).
 * electron/preload.cjs выставляет этот мост через contextBridge.
 */
interface ElectronStorageBridge {
  exec(sql: string, params?: unknown[]): Promise<void>;
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

declare global {
  interface Window {
    electronStorage?: ElectronStorageBridge;
  }
}

export function isElectronStorageAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.electronStorage;
}

export class ElectronStorageAdapter implements StorageAdapter {
  private get bridge(): ElectronStorageBridge {
    if (!window.electronStorage) {
      throw new Error(
        'window.electronStorage is not available — ElectronStorageAdapter must run inside the ' +
          'Electron renderer with electron/preload.cjs loaded.'
      );
    }
    return window.electronStorage;
  }

  async exec(sql: string, params: unknown[] = []): Promise<void> {
    await this.bridge.exec(sql, params);
  }

  async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    return this.bridge.query<T>(sql, params);
  }

  /**
   * IPC-вызовы из renderer идут строго последовательно (await между каждым),
   * а better-sqlite3 в main держит единственное синхронное соединение — так
   * что begin/exec.../commit отсюда физически попадают в одну и ту же
   * SQLite-транзакцию, несмотря на то что каждый шаг — отдельный round-trip.
   */
  async transaction(work: (tx: StorageAdapter) => Promise<void>): Promise<void> {
    await this.bridge.begin();
    try {
      await work(this);
      await this.bridge.commit();
    } catch (err) {
      await this.bridge.rollback();
      throw err;
    }
  }
}
