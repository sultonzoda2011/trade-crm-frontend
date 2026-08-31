import { apiClient } from '~/lib/client';
import { filtersToParams } from '~/lib/filtersToParams';
import type { ActiveFilter } from '~/types/filters';
import type {
  CreateSellerCreditRequest,
  SellerBalanceResponse,
  SellerCreditResponse,
  SellerCreditsResponse,
  SellerDetailResponse,
  SellersResponse,
} from '~/types/sellers';

export const sellersApi = {
  getAll: async (
    page = 1,
    limit = 20,
    options: { search?: string; dateFrom?: string; dateTo?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {},
    filters: ActiveFilter[] = []
  ): Promise<SellersResponse> => {
    const { data } = await apiClient.get('/sellers', {
      params: { page, limit, ...options, ...filtersToParams(filters) },
    });
    return data;
  },

  getById: async (id: string): Promise<SellerDetailResponse> => {
    const { data } = await apiClient.get(`/sellers/${id}`);
    return data;
  },
  create: async (formData: FormData) => {
    const { data } = await apiClient.post('/sellers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  update: async ({ formData, id }: { formData: FormData; id: string }) => {
    const { data } = await apiClient.patch(`/sellers/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/sellers/${id}`);
  },

  getBalance: async (id: string): Promise<SellerBalanceResponse> => {
    const { data } = await apiClient.get(`/sellers/${id}/balance`);
    return data;
  },
  getCredits: async (id: string, page = 1, limit = 10): Promise<SellerCreditsResponse> => {
    const { data } = await apiClient.get(`/sellers/${id}/credits`, { params: { page, limit } });
    return data;
  },
  createCredit: async ({ id, request }: { id: string; request: CreateSellerCreditRequest }): Promise<SellerCreditResponse> => {
    const { data } = await apiClient.post(`/sellers/${id}/credits`, request);
    return data;
  },
};
