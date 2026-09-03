import type { SyncEntityConfig } from './entities';
import { setLastSyncedAt } from './syncMeta';

export interface ListSyncProgress {
  page: number;
  totalPages: number;
}

export interface DetailSyncProgress {
  done: number;
  total: number;
}

/**
 * Скачивает ВСЕ страницы getAll этой сущности (с дефолтным limit, без
 * поиска/фильтров — см. комментарий в entities.ts) последовательно.
 * Каждый успешный GET автоматически попадает в офлайн-кэш через
 * response-интерцептор в app/lib/client.ts — здесь просто вызываем API как
 * обычно, ничего вручную в кэш не пишем.
 *
 * Возвращает id всех записей — нужны следующим шагом для synceEntityDetails.
 */
export async function syncEntityList(
  entity: SyncEntityConfig,
  onProgress?: (p: ListSyncProgress) => void
): Promise<string[]> {
  const ids: string[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await entity.listFn(page, entity.listLimit);
    const items = response.data.data ?? [];
    totalPages = response.data.meta?.totalPages ?? 1;
    ids.push(...items.map((item) => entity.getId(item)));
    onProgress?.({ page, totalPages });
    page += 1;
  } while (page <= totalPages);

  await setLastSyncedAt(entity.key, 'list');
  return ids;
}

/**
 * Скачивает getById/detail для списка id с ограниченным параллелизмом —
 * при ~200 записях этого достаточно, чтобы не открывать 200 соединений
 * разом и не перегружать бэкенд/телефон. Ошибка по одной записи не
 * прерывает весь прогон — просто пропускаем её и идём дальше.
 */
export async function syncEntityDetails(
  entity: SyncEntityConfig,
  ids: string[],
  onProgress?: (p: DetailSyncProgress) => void,
  concurrency = 5
): Promise<void> {
  if (!entity.detailFn || ids.length === 0) return;

  let done = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < ids.length) {
      const id = ids[cursor];
      cursor += 1;
      try {
        await entity.detailFn!(id);
      } catch {
        // Одна запись не подтянулась (например, удалена на сервере в этот
        // момент) — не критично, продолжаем с остальными.
      }
      done += 1;
      onProgress?.({ done, total: ids.length });
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, ids.length) }, worker));
  await setLastSyncedAt(entity.key, 'detail');
}
