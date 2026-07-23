import { apiClient } from '~/lib/client';
import { filtersToParams } from '~/lib/filtersToParams';
import type { DebtorDetailResponse, DebtorRequest, DebtorsResponse } from '~/types/debtors';
import type { ActiveFilter } from '~/types/filters';

export const debtorsApi = {
  getAll: async (page = 1, limit = 20, filters: ActiveFilter[] = []): Promise<DebtorsResponse> => {
    const { data } = await apiClient.get('/debtors', {
      params: {
        page,
        limit,
        ...filtersToParams(filters),
      },
    });

    return data;
  },

  getById: async (id: string): Promise<DebtorDetailResponse> => {
    const { data } = await apiClient.get(`/debtors/${id}`);
    return data;
  },
  create: async (request: DebtorRequest) => {
    const { data } = await apiClient.post(`/debtors`, request);
    return data;
  },
  update: async ({ request, id }: { request: DebtorRequest; id: string }) => {
    const { data } = await apiClient.patch(`/debtors/${id}`, request);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/debtors/${id}`);
  },
};
