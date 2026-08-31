import { apiClient } from '~/lib/client';
import { filtersToParams } from '~/lib/filtersToParams';
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

export const transactionsApi = {
  getAll: async (
    page = 1,
    limit = 20,
    options: { search?: string; dateFrom?: string; dateTo?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {},
    filters: ActiveFilter[] = []
  ): Promise<TransactionsResponse> => {
    const { data } = await apiClient.get('/transactions', {
      params: { page, limit, ...options, ...filtersToParams(filters) },
    });
    return data;
  },

  getById: async (id: string): Promise<TransactionResponse> => {
    const { data } = await apiClient.get(`/transactions/${id}`);
    return data;
  },

  getDetail: async (id: string): Promise<TransactionDetailResponse> => {
    const { data } = await apiClient.get(`/transactions/${id}/detail`);
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
