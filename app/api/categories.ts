import type { ActiveFilter } from '~/types/filters';
import { filtersToParams } from '~/lib/filtersToParams';
import { apiClient } from '~/lib/client';
import { listRecords } from '~/lib/offline/db';
import { getIsOnline } from '~/lib/offline/networkStatus';
import type {
  CategoriesResponse,
  CategoryDetailResponse,
} from '~/types/products';

const isOffline = (): boolean => !getIsOnline();

interface OfflineCategory {
  id: string;
  name: string;
  marketId: string;
  updatedAt: string;
}

export const categoriesApi = {
  getAll: async (
    page = 1,
    limit = 20,
    options: { search?: string; dateFrom?: string; dateTo?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {},
    filters: ActiveFilter[] = []
  ): Promise<CategoriesResponse> => {
    if (isOffline()) {
      const all = await listRecords<OfflineCategory>('categories');
      const search = options.search?.trim().toLowerCase();
      const filtered = search ? all.filter((c) => c.name.toLowerCase().includes(search)) : all;
      const start = (page - 1) * limit;
      const pageItems = filtered.slice(start, start + limit).map(
        (c): CategoriesResponse['data']['data'][number] =>
          ({
            id: c.id,
            name: c.name,
            description: null,
            marketId: c.marketId,
            image: null,
            createdAt: c.updatedAt,
            updatedAt: c.updatedAt,
            _count: { products: 0 },
          }) as any
      );
      return {
        success: true,
        data: {
          data: pageItems,
          meta: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) || 1 },
        },
        timestamp: new Date().toISOString(),
      };
    }
    const { data } = await apiClient.get('/categories', {
      params: { page, limit, ...options, ...filtersToParams(filters) },
    });
    return data;
  },
  getById: async (id: string): Promise<CategoryDetailResponse> => {
    const { data } = await apiClient.get(`/categories/${id}`);
    return data;
  },
  create: async (formData: FormData): Promise<CategoryDetailResponse> => {
    const { data } = await apiClient.post('/categories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  update: async ({ formData, id }: { formData: FormData; id: string }): Promise<CategoryDetailResponse> => {
    const { data } = await apiClient.patch(`/categories/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },
};
