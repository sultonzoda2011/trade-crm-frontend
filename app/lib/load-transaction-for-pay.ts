import type { QueryClient } from '@tanstack/react-query';
import { transactionsApi } from '~/api/transactions';
import { getIsOnline } from '~/lib/network-status';
import { collectOverlayOps, withPendingPayments } from '~/lib/offline-overlay';
import { queryKeys } from '~/lib/query-keys';
import type { Transaction, TransactionListItem } from '~/types/transactions';

/** Сколько ждём ответа сервера, прежде чем взять то, что уже есть на устройстве. */
const FETCH_BUDGET_MS = 4000;

type PayableTransaction = Transaction | TransactionListItem;

/**
 * Транзакция из кеша — детальная карточка или строка любого загруженного списка.
 * Окну оплаты нужны только сумма, остаток и позиции, а они есть и там, и там.
 */
function findCachedTransaction(queryClient: QueryClient, id: string): PayableTransaction | undefined {
  const full = queryClient.getQueryData<{ data?: PayableTransaction }>(queryKeys.full('transactions', id));
  if (full?.data?.id === id) return full.data;

  const detail = queryClient.getQueryData<{ data?: PayableTransaction }>(queryKeys.detail('transactions', id));
  if (detail?.data) return detail.data;

  const lists = queryClient.getQueriesData<{ data?: { data?: TransactionListItem[] } }>({
    queryKey: [...queryKeys.entity('transactions'), 'list'],
  });
  for (const [, value] of lists) {
    const hit = value?.data?.data?.find((tx) => tx.id === id);
    if (hit) return hit;
  }
  return undefined;
}

/**
 * Транзакция для окна оплаты — и без связи, и на слабой. С сетью идём за свежими данными, но
 * не дольше FETCH_BUDGET_MS: продавец у прилавка не будет ждать крутилку ради окна ввода суммы.
 * Не получилось — берём копию на устройстве. Из остатка вычтены оплаты, что ещё стоят в очереди,
 * иначе окно предложило бы заплатить больше, чем осталось.
 */
export async function loadTransactionForPay(queryClient: QueryClient, id: string): Promise<PayableTransaction> {
  const cached = findCachedTransaction(queryClient, id);

  let transaction: PayableTransaction | undefined;
  if (getIsOnline()) {
    try {
      const response = await Promise.race([
        transactionsApi.getById(id),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), FETCH_BUDGET_MS)),
      ]);
      transaction = response.data;
    } catch (error) {
      if (!cached) throw error;
    }
  }

  const found = transaction ?? cached;
  if (!found) throw new Error('transaction-unavailable');
  return withPendingPayments(found, collectOverlayOps(queryClient));
}
