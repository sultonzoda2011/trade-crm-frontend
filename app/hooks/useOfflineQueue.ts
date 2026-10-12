import { useMutationState } from '@tanstack/react-query';
import { useMemo } from 'react';
import { isQueueMutation, toQueueItem, type QueueItem } from '~/lib/offline-queue';

export interface OfflineQueueState {
  items: QueueItem[];
  /** Ещё не отправлено: ждёт, в пути или повторяется. */
  pending: number;
  /** Остановилось с ошибкой и ждёт решения. */
  failed: number;
  /** Всё, что требует внимания: pending + failed. */
  total: number;
}

/** Живой список офлайн-очереди. Обновляется сам при любом изменении MutationCache. */
export function useOfflineQueue(): OfflineQueueState {
  const rows = useMutationState({
    filters: { predicate: (mutation) => isQueueMutation(mutation as never) },
    select: (mutation) => toQueueItem(mutation as never),
  });

  return useMemo(() => {
    const items = rows
      .filter((item): item is QueueItem => item !== null)
      .sort((a, b) => a.queuedAt - b.queuedAt);
    const failed = items.filter((item) => item.status === 'failed').length;
    return { items, pending: items.length - failed, failed, total: items.length };
  }, [rows]);
}
