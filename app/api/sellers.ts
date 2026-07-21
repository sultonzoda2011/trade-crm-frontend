import { apiClient } from '~/lib/client';
import { filtersToParams } from '~/lib/filtersToParams';
import type { ActiveFilter } from '~/types/filters';
import type { SellerDetailResponse, SellerRequest, SellersResponse } from '~/types/sellers';

export const sellersApi = {
  getAll: async (page = 1, limit = 20, filters: ActiveFilter[] = []): Promise<SellersResponse> => {
    const { data } = await apiClient.get('/sellers', {
      params: {
        page,
        limit,
        ...filtersToParams(filters),
      },
    });

    return data;
  },

  getById: async (id: string): Promise<SellerDetailResponse> => {
    const { data } = await apiClient.get(`/sellers/${id}`);
    return data;
  },
  create: async ({ request }: { request: SellerRequest }) => {
    const { data } = await apiClient.post(`/sellers`, request);
    return data;
  },
  update: async ({ request, id }: { request: SellerRequest; id: string }) => {
    const { data } = await apiClient.patch(`/sellers/${id}`, request);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/sellers/${id}`);
  },
};
