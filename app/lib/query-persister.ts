import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { offlineStorage } from '~/lib/offline-storage';

/**
 * Бампается только при несовместимом изменении формы кеша (например,
 * серьёзный рефакторинг query-keys), чтобы старые персистентные записи
 * не ломали новую версию приложения — см. `buster` в persistQueryClient.
 */
export const CACHE_BUSTER = 'v1';

export const queryPersister = createAsyncStoragePersister({
  storage: offlineStorage,
  key: 'tradecrm-query-cache',
  // Без throttle дешидрация шла бы на каждый чих стора; 1с достаточно,
  // чтобы не писать в SQLite синхронно на каждый render.
  throttleTime: 1000,
});
