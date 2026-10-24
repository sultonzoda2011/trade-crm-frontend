import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { loadTransactionForPay } from '~/lib/load-transaction-for-pay';
import { useTransactionsModals } from '~/routes/(crm)/transactions/store';

/**
 * Открыть окно оплаты по id транзакции.
 *
 * Список и свайп знают только id (`activeDebtTransactionId`), а окну нужен полный
 * Transaction — товары, сумма. Без связи или на слабой берётся копия с устройства
 * (см. `loadTransactionForPay`); `networkMode: 'always'` — иначе без сети загрузка
 * вообще не стартовала бы и кнопка крутилась бы вечно.
 */
export function useOpenPay(errorMessage: string) {
  const payModal = useTransactionsModals((s) => s.pay);
  const queryClient = useQueryClient();

  return useMutation({
    networkMode: 'always',
    mutationFn: (transactionId: string) => loadTransactionForPay(queryClient, transactionId),
    onSuccess: (transaction) => payModal.open(transaction),
    onError: () => toast.error(errorMessage),
  });
}
