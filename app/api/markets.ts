import { isOfflineCapable } from '~/lib/offline/platform';
import { getMarketById, getOwnMarket } from '@trade-crm/offline-core';
import { apiClient } from '~/lib/client';
import { filtersToParams } from '~/lib/filtersToParams';
import { getStorage } from '~/lib/offline/storage';
import type { ActiveFilter } from '~/types/filters';
import type { MarketDetailResponse, MarketsResponse } from '~/types/markets';

export const marketsApi = {
  /** Офлайн виден только свой маркет (сервер и online тоже не отдаёт чужие продавцу/владельцу без прав) — оборачиваем в тот же пагинированный вид. */
  getAll: async (
    page = 1,
    limit = 20,
    options: { search?: string; dateFrom?: string; dateTo?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {},
    filters: ActiveFilter[] = []
  ): Promise<MarketsResponse> => {
    if (isOfflineCapable()) {
      const storage = await getStorage();
      const market = await getOwnMarket(storage);
      const items = market ? [market] : [];
      return {
        success: true,
        data: { data: items as any, meta: { page: 1, limit, total: items.length, totalPages: 1 } },
        timestamp: new Date().toISOString(),
      };
    }
    const { data } = await apiClient.get('/markets', {
      params: { page, limit, ...options, ...filtersToParams(filters) },
    });
    return data;
  },

  getById: async (id: string): Promise<MarketDetailResponse> => {
    if (isOfflineCapable()) {
      const storage = await getStorage();
      const market = await getMarketById(storage, id);
      if (!market) throw new Error(`Market ${id} not found locally`);
      return { success: true, data: market as any, timestamp: new Date().toISOString() };
    }
    const { data } = await apiClient.get(`/markets/${id}`);
    return data;
  },
  /** Создание/правка маркета — только онлайн (админская операция, редкая). */
  create: async (formData: FormData) => {
    const { data } = await apiClient.post('/markets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  update: async ({ formData, id }: { formData: FormData; id: string }) => {
    const { data } = await apiClient.patch(`/markets/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/markets/${id}`);
  },
};
