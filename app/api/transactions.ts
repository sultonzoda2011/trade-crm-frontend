import { apiClient } from '~/lib/client';
import { filtersToParams } from '~/lib/filtersToParams';
import type { ActiveFilter } from '~/types/filters';
import type {
  CreatePaymentRequest,
  CreateTransactionRequest,
  TransactionDetailResponse,
  TransactionsResponse,
  UpdateTransactionRequest,
} from '~/types/transactions';

export const transactionsApi = {
  getAll: async (page = 1, limit = 20, filters: ActiveFilter[] = []): Promise<TransactionsResponse> => {
    const { data } = await apiClient.get('/transactions', {
      params: {
        page,
        limit,
        ...filtersToParams(filters),
      },
    });

    return data;
  },

  getById: async (id: string): Promise<TransactionDetailResponse> => {
    const { data } = await apiClient.get(`/transactions/${id}`);
    return data;
  },
  create: async (request: CreateTransactionRequest) => {
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
    const { data } = await apiClient.patch(`/transactions/${id}/pay`, request);
    return data;
  },
  refund: async (id: string): Promise<TransactionDetailResponse> => {
    const { data } = await apiClient.post(`/transactions/${id}/refund`);
    return data;
  },
};
