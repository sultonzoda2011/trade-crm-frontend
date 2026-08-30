import { CapacitorSqliteStorageAdapter } from '@trade-crm/storage-capacitor';
import type { StorageAdapter } from '@trade-crm/offline-core';
import { Capacitor } from '@capacitor/core';

let adapterPromise: Promise<StorageAdapter> | null = null;

/**
 * Единственная точка получения StorageAdapter во всём приложении. init()
 * гоняется один раз (Promise кэшируется), последующие вызовы получают уже
 * готовое соединение. На вебе (не Capacitor native) SQLite-плагин
 * недоступен — до появления storage-web-адаптера бросаем понятную ошибку,
 * а не тихо ломаемся посреди запроса.
 */
export function getStorage(): Promise<StorageAdapter> {
  if (!adapterPromise) {
    adapterPromise = (async () => {
      if (!Capacitor.isNativePlatform()) {
        throw new Error(
          'Offline storage is only wired up for the native Capacitor build right now. ' +
            'Add a storage-web adapter before running this in a plain browser.'
        );
      }
      const adapter = new CapacitorSqliteStorageAdapter();
      await adapter.init();
      return adapter;
    })();
  }
  return adapterPromise;
}
