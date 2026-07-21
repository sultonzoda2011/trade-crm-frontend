import { apiClient } from '~/lib/client';
import { filtersToParams } from '~/lib/filtersToParams';
import type { ActiveFilter } from '~/types/filters';
import type { MarketDetailResponse, MarketsResponse } from '~/types/markets';

export const marketsApi = {
  getAll: async (page = 1, limit = 20, filters: ActiveFilter[] = []): Promise<MarketsResponse> => {
    const { data } = await apiClient.get('/markets', {
      params: {
        page,
        limit,
        ...filtersToParams(filters),
      },
    });

    return data;
  },

  getById: async (id: string): Promise<MarketDetailResponse> => {
    const { data } = await apiClient.get(`/markets/${id}`);
    return data;
  },
  create: async (formData: FormData) => {
    const { data } = await apiClient.post('/markets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
  update: async ({ formData, id }: { formData: FormData; id: string }) => {
    const { data } = await apiClient.patch(`/markets/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/markets/${id}`);
  },
};
