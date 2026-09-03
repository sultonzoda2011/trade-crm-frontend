import type { SyncEntityConfig } from './entities';
import { readFromCache } from './readCache';
import { setLastSyncedAt } from './syncMeta';

export interface ListSyncProgress {
  page: number;
  totalPages: number;
}

export interface ListSyncItem {
  id: string;
  updatedAt?: string;
}

export interface DetailSyncProgress {
  done: number;
  total: number;
  /** Сколько из done было пропущено — карточка уже была свежей в кэше. */
  skipped: number;
}

/**
 * Скачивает ВСЕ страницы getAll этой сущности (с дефолтным limit, без
 * поиска/фильтров — см. комментарий в entities.ts) последовательно.
 * Каждый успешный GET автоматически попадает в офлайн-кэш через
 * response-интерцептор в app/lib/client.ts — здесь просто вызываем API как
 * обычно, ничего вручную в кэш не пишем.
 *
 * Возвращает id + updatedAt всех записей — нужны следующим шагом для
 * syncEntityDetails, чтобы понять, какие карточки реально изменились.
 */
export async function syncEntityList(
  entity: SyncEntityConfig,
  onProgress?: (p: ListSyncProgress) => void
): Promise<ListSyncItem[]> {
  const items: ListSyncItem[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await entity.listFn(page, entity.listLimit);
    const pageItems = response.data.data ?? [];
    totalPages = response.data.meta?.totalPages ?? 1;
    items.push(...pageItems.map((item) => ({ id: entity.getId(item), updatedAt: entity.getUpdatedAt?.(item) })));
    onProgress?.({ page, totalPages });
    page += 1;
  } while (page <= totalPages);

  await setLastSyncedAt(entity.key, 'list');
  return items;
}

/**
 * Проверяет, есть ли уже в офлайн-кэше свежая карточка этой записи — без
 * сетевого запроса. "Свежая" значит: updatedAt в кэше совпадает с
 * updatedAt из только что полученного списка. Если сущность не отдаёт
 * updatedAt (см. entities.ts, sellers) — считаем кэш неизвестным и не
 * пропускаем, чтобы не получить незаметно устаревшие данные.
 */
async function isDetailFresh(entity: SyncEntityConfig, item: ListSyncItem): Promise<boolean> {
  if (!entity.detailUrl || !item.updatedAt) return false;
  const cached = await readFromCache<{ data?: { updatedAt?: string } }>(entity.detailUrl(item.id));
  return cached?.data?.updatedAt === item.updatedAt;
}

/**
 * Скачивает getById/detail для записей из списка — но только те, что
 * реально изменились с прошлого раза (см. isDetailFresh). Это и есть
 * "умное" обновление: повторный прогон по тем же ~200 записям без
 * изменений на сервере почти не делает сетевых запросов.
 *
 * Параллелизм ограничен (5 одновременно) — при ~200 записях этого
 * достаточно, чтобы не открывать кучу соединений разом и не перегружать
 * бэкенд/телефон. Ошибка по одной записи не прерывает весь прогон.
 */
export async function syncEntityDetails(
  entity: SyncEntityConfig,
  items: ListSyncItem[],
  onProgress?: (p: DetailSyncProgress) => void,
  concurrency = 5
): Promise<void> {
  if (!entity.detailFn || items.length === 0) return;

  let done = 0;
  let skipped = 0;
  let cursor = 0;
  const total = items.length;

  async function worker() {
    while (cursor < items.length) {
      const item = items[cursor];
      cursor += 1;

      if (await isDetailFresh(entity, item)) {
        skipped += 1;
      } else {
        try {
          await entity.detailFn!(item.id);
        } catch {
          // Одна запись не подтянулась (например, удалена на сервере в этот
          // момент) — не критично, продолжаем с остальными.
        }
      }

      done += 1;
      onProgress?.({ done, total, skipped });
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  await setLastSyncedAt(entity.key, 'detail');
}
