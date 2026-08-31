import { isOfflineCapable } from '~/lib/offline/platform';
import { getAllUsers, getUserById } from '@trade-crm/offline-core';
import { apiClient } from '~/lib/client';
import { filtersToParams } from '~/lib/filtersToParams';
import { getStorage } from '~/lib/offline/storage';
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
  /** Список продавцов — та же локальная таблица users, отфильтрованная по роли SELLER. */
  getAll: async (
    page = 1,
    limit = 20,
    options: { search?: string; dateFrom?: string; dateTo?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {},
    filters: ActiveFilter[] = []
  ): Promise<SellersResponse> => {
    if (isOfflineCapable()) {
      const storage = await getStorage();
      const { items, total } = await getAllUsers(storage, { search: options.search, role: 'SELLER', page, limit });
      return {
        success: true,
        data: { data: items as any, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } },
        timestamp: new Date().toISOString(),
      };
    }
    const { data } = await apiClient.get('/sellers', {
      params: { page, limit, ...options, ...filtersToParams(filters) },
    });
    return data;
  },

  getById: async (id: string): Promise<SellerDetailResponse> => {
    if (isOfflineCapable()) {
      const storage = await getStorage();
      const seller = await getUserById(storage, id);
      if (!seller) throw new Error(`Seller ${id} not found locally`);
      return { success: true, data: seller as any, timestamp: new Date().toISOString() };
    }
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

  // Баланс/выплаты — финансовая операция с пересчётом на сервере, всегда только онлайн.
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
