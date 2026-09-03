import { getStore } from './store';

// Отдельный маленький namespace 'sync-meta' — когда последний раз успешно
// прогонялась синхронизация списка/карточек по каждой сущности. Используется
// только для отображения "Обновлено 2 мин назад" на /sync и /sync/<entity>.
export async function getLastSyncedAt(entityKey: string, kind: 'list' | 'detail'): Promise<string | null> {
  const store = await getStore('sync-meta');
  return store.get(`${entityKey}:${kind}`);
}

export async function setLastSyncedAt(entityKey: string, kind: 'list' | 'detail'): Promise<void> {
  const store = await getStore('sync-meta');
  await store.set(`${entityKey}:${kind}`, new Date().toISOString());
}
