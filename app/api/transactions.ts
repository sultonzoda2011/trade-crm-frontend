import { apiClient } from '~/lib/client';
import { filtersToParams } from '~/lib/filtersToParams';
import { createTransactionOffline, payTransactionOffline, refundTransactionOffline } from '~/lib/offline/offlineTransactions';
import { getIsOnline } from '~/lib/offline/networkStatus';
import { enqueueOutbox } from '~/lib/offline/outbox';
import type { ActiveFilter } from '~/types/filters';
import type {
  CreatePaymentRequest,
  CreateTransactionRequest,
  RefundTransactionRequest,
  TransactionDetailResponse,
  TransactionResponse,
  TransactionsResponse,
  UpdateTransactionRequest,
} from '~/types/transactions';

const isOffline = (): boolean => !getIsOnline();

export const transactionsApi = {
  getAll: async (
    page = 1,
    limit = 20,
    options: { search?: string; dateFrom?: string; dateTo?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {},
    filters: ActiveFilter[] = []
  ): Promise<TransactionsResponse> => {
    const { data } = await apiClient.get('/transactions', {
      params: {
        page,
        limit,
        ...options,
        ...filtersToParams(filters),
      },
    });
    return data;
  },

  getById: async (id: string): Promise<TransactionResponse> => {
    const { data } = await apiClient.get(`/transactions/${id}`);
    return data;
  },
  /**
   * Transaction as a business process: lines with their remaining refundable
   * quantity, payments, refunds, the original sale and a merged event timeline.
   * `getById` stays for the places that only need the plain record.
   */
  getDetail: async (id: string): Promise<TransactionDetailResponse> => {
    const { data } = await apiClient.get(`/transactions/${id}/detail`);
    return data;
  },
  /**
   * Offline: считаем транзакцию локально (offlineTransactions.ts), кладём
   * в очередь на отправку и сразу возвращаем результат в форме обычного
   * ApiResponse — вызывающий код (useMutation onSuccess/навигация/тосты)
   * не знает и не должен знать, была ли сеть.
   */
  create: async (request: CreateTransactionRequest) => {
    if (isOffline()) {
      const transaction = await createTransactionOffline(request);
      await enqueueOutbox({
        method: 'post',
        url: '/transactions',
        body: request,
        entity: 'transactions',
        localId: transaction.id,
      });
      return { success: true, data: transaction, timestamp: transaction.createdAt };
    }
    const { data } = await apiClient.post(`/transactions`, request);
    return data;
  },
  update: async ({ request, id }: { request: UpdateTransactionRequest; id: string }) => {
    const { data } = await apiClient.patch(`/transactions/${id}`, request);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/transactions/${id}`);
  },
  pay: async ({ request, id }: { request: CreatePaymentRequest; id: string }) => {
    if (isOffline()) {
      const transaction = await payTransactionOffline(id, request);
      await enqueueOutbox({
        method: 'patch',
        url: `/transactions/${id}/pay`,
        body: request,
        entity: 'transactions',
        localId: id,
      });
      return { success: true, data: transaction, timestamp: transaction.updatedAt };
    }
    const { data } = await apiClient.patch(`/transactions/${id}/pay`, request);
    return data;
  },
  /**
   * Partial or full refund. Omitting `request` returns everything still
   * refundable, which keeps the previous whole-transaction behaviour working.
   */
  refund: async ({
    id,
    request,
  }: {
    id: string;
    request?: RefundTransactionRequest;
  }): Promise<TransactionDetailResponse> => {
    if (isOffline()) {
      const refundTx = await refundTransactionOffline(id, request?.items);
      await enqueueOutbox({
        method: 'post',
        url: `/transactions/${id}/refund`,
        body: request ?? {},
        entity: 'transactions',
        localId: refundTx.id,
      });
      return { success: true, data: refundTx, timestamp: refundTx.createdAt } as unknown as TransactionDetailResponse;
    }
    const { data } = await apiClient.post(`/transactions/${id}/refund`, request ?? {});
    return data;
  },
};
