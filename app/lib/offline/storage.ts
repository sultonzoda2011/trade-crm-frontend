import { CapacitorSqliteStorageAdapter } from '@trade-crm/storage-capacitor';
import { ElectronStorageAdapter, isElectronStorageAvailable } from '@trade-crm/storage-electron';
import type { StorageAdapter } from '@trade-crm/offline-core';
import { Capacitor } from '@capacitor/core';

let adapterPromise: Promise<StorageAdapter> | null = null;

/**
 * Единственная точка получения StorageAdapter во всём приложении. init()
 * гоняется один раз (Promise кэшируется), последующие вызовы получают уже
 * готовое соединение. Платформа определяется здесь же: Capacitor native
 * (Android/iOS) → SQLite-плагин, Electron → IPC-мост к better-sqlite3 в
 * main-процессе, обычный браузер (не native, не Electron) → до появления
 * storage-web адаптера бросаем понятную ошибку вместо тихого падения.
 */
export function getStorage(): Promise<StorageAdapter> {
  if (!adapterPromise) {
    adapterPromise = (async () => {
      if (Capacitor.isNativePlatform()) {
        const adapter = new CapacitorSqliteStorageAdapter();
        await adapter.init();
        return adapter;
      }
      if (isElectronStorageAvailable()) {
        // Соединение и схема уже подняты в electron/main.cjs при старте
        // приложения — тут просто возвращаем адаптер поверх готового моста.
        return new ElectronStorageAdapter();
      }
      throw new Error(
        'Offline storage is only wired up for Capacitor (Android/iOS) and Electron builds right now. ' +
          'Add a storage-web adapter before running this in a plain browser.'
      );
    })();
  }
  return adapterPromise;
}
