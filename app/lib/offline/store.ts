import type { KvStore } from './kvStore';
import { isNativePlatform } from './platform';

const stores = new Map<string, Promise<KvStore>>();

// Ленивый выбор бэкенда (SQLite на Android / IndexedDB везде ещё) с
// кэшированием по namespace, чтобы не пересоздавать соединение на каждый
// вызов. namespace: 'cache' (read-кэш getAll) или 'queue' (очередь мутаций).
export function getStore(namespace: string): Promise<KvStore> {
  let promise = stores.get(namespace);
  if (!promise) {
    promise = (async () => {
      if (await isNativePlatform()) {
        const { createSqliteStore } = await import('./sqliteStore');
        return createSqliteStore(namespace);
      }
      const { createIndexedDbStore } = await import('./indexedDbStore');
      return createIndexedDbStore(namespace);
    })();
    stores.set(namespace, promise);
  }
  return promise;
}
