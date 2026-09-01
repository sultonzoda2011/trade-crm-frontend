import type { QueryClient } from '@tanstack/react-query';
import { apiClient } from '~/lib/client';
import { getIsOnline, onNetworkChange } from './network';
import { hasExceededRetries, listQueue, removeQueueItem, updateQueueItem, type QueuedMutation } from './queue';

let syncInFlight: Promise<void> | null = null;

async function sendOne(item: QueuedMutation): Promise<void> {
  await apiClient.request({
    method: item.method,
    url: item.url,
    data: item.payload,
    headers: { 'Idempotency-Key': item.id },
  });
}

/**
 * Прогоняет очередь по порядку (FIFO — create транзакции всегда уходит
 * раньше, чем pay/refund по ней). Ошибка одного элемента не должна прервать
 * обработку следующих: только либо isConflict (409, значит уже применилось
 * ранее — считаем успехом и снимаем с очереди), либо сетевая ошибка
 * (сеть пропала посреди синка — прерываем весь проход, вернёмся к нему при
 * следующем подключении), либо превышение попыток -> статус 'failed',
 * элемент остаётся в очереди на странице /sync для ручного решения.
 */
export async function runSync(queryClient?: QueryClient): Promise<void> {
  if (!(await getIsOnline())) return;
  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    const queue = (await listQueue()).filter((i) => i.status !== 'syncing');

    for (const item of queue) {
      await updateQueueItem(item.id, { status: 'syncing' });
      try {
        await sendOne(item);
        await removeQueueItem(item.id);
      } catch (err: any) {
        if (err?.response?.status === 409) {
          // Уже обработано на предыдущей попытке (idempotency сработала) — успех.
          await removeQueueItem(item.id);
          continue;
        }
        if (!err?.response) {
          // Сеть оборвалась посреди синка — прекращаем проход, не трогаем
          // оставшиеся элементы, дождёмся следующего 'online'.
          await updateQueueItem(item.id, { status: 'pending' });
          break;
        }
        const attempts = item.attempts + 1;
        await updateQueueItem(item.id, {
          status: hasExceededRetries({ ...item, attempts }) ? 'failed' : 'pending',
          attempts,
          error: err?.response?.data?.message ?? err?.message ?? 'Sync failed',
        });
      }
    }

    if (queryClient) {
      // Подтягиваем свежие данные с сервера после синка (транзакции, долги,
      // остатки товаров — всё, что могло измениться в результате очереди).
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['debtors'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
    }

    syncInFlight = null;
  })();

  return syncInFlight;
}

/** Вызывать один раз при старте приложения (app/root.tsx). */
export function initSyncListener(queryClient: QueryClient): () => void {
  runSync(queryClient);
  return onNetworkChange((online) => {
    if (online) runSync(queryClient);
  });
}
