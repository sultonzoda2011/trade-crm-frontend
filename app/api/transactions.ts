import { isOfflineCapable } from '~/lib/offline/platform';
import {
  createTransactionOffline,
  getAllTransactions,
  getTransactionById,
  payTransactionOffline,
} from '@trade-crm/offline-core';
import { getClientUser } from '~/lib/auth-utils';
import { apiClient } from '~/lib/client';
import { filtersToParams } from '~/lib/filtersToParams';
import { getStorage } from '~/lib/offline/storage';
import { useSyncStore } from '~/store/useSyncStore';
import type { ActiveFilter } from '~/types/filters';
import type {
  CreatePaymentRequest,
  CreateTransactionRequest,
  RefundTransactionRequest,
  Transaction,
  TransactionDetailResponse,
  TransactionResponse,
  TransactionsResponse,
  UpdateTransactionRequest,
} from '~/types/transactions';

export const transactionsApi = {
  getAll: async (
    page = 1,
    limit = 20,
    options: { search?: string; dateFrom?: string; dateTo?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {},
    filters: ActiveFilter[] = []
  ): Promise<TransactionsResponse> => {
    if (isOfflineCapable()) {
      const storage = await getStorage();
      const { items, total } = await getAllTransactions<Transaction>(storage, { page, limit });
      return {
        success: true,
        data: { data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } },
        timestamp: new Date().toISOString(),
      };
    }
    const { data } = await apiClient.get('/transactions', {
      params: { page, limit, ...options, ...filtersToParams(filters) },
    });
    return data;
  },

  getById: async (id: string): Promise<TransactionResponse> => {
    if (isOfflineCapable()) {
      const storage = await getStorage();
      const tx = await getTransactionById<Transaction>(storage, id);
      if (!tx) throw new Error(`Transaction ${id} not found locally`);
      return { success: true, data: tx, timestamp: new Date().toISOString() };
    }
    const { data } = await apiClient.get(`/transactions/${id}`);
    return data;
  },

  /** Детальный вид (лайны + возвраты + таймлайн) — требует пересчёта на сервере, только онлайн. */
  getDetail: async (id: string): Promise<TransactionDetailResponse> => {
    const { data } = await apiClient.get(`/transactions/${id}/detail`);
    return data;
  },

  /** Создание продажи/долга разрешено офлайн: списывает остаток локально + outbox.
   *  REFUND через этот метод не создаётся (см. отдельный refund()) — только онлайн. */
  create: async (request: CreateTransactionRequest) => {
    if (isOfflineCapable() && request.type !== 'REFUND') {
      const storage = await getStorage();
      const marketId = getClientUser()?.marketId ?? '';
      const tx = await createTransactionOffline(storage, {
        marketId,
        type: request.type,
        paymentType: request.paymentType,
        debtorId: request.debtorId,
        items: request.items,
      });
      await useSyncStore.getState().refreshPendingCount();
      return { success: true, data: JSON.parse(tx.payload), timestamp: new Date().toISOString() };
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

  /** Оплата долга офлайн — только для транзакций, уже уехавших на сервер (есть server_id). */
  pay: async ({ request, id }: { request: CreatePaymentRequest; id: string }) => {
    if (isOfflineCapable()) {
      const storage = await getStorage();
      await payTransactionOffline(storage, id, request);
      await useSyncStore.getState().refreshPendingCount();
      return { success: true, timestamp: new Date().toISOString() };
    }
    const { data } = await apiClient.patch(`/transactions/${id}/pay`, request);
    return data;
  },

  /** Возврат — пересчёт на сервере (частичный/остаточный), только онлайн. */
  refund: async ({
    id,
    request,
  }: {
    id: string;
    request?: RefundTransactionRequest;
  }): Promise<TransactionDetailResponse> => {
    const { data } = await apiClient.post(`/transactions/${id}/refund`, request ?? {});
    return data;
  },
};
