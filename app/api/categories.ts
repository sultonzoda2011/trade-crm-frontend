import { Capacitor } from '@capacitor/core';
import { getAllCategories } from '@trade-crm/offline-core';
import { apiClient } from '~/lib/client';
import { filtersToParams } from '~/lib/filtersToParams';
import { getStorage } from '~/lib/offline/storage';
import type { ActiveFilter } from '~/types/filters';
import type { CategoriesResponse, CategoryDetailResponse, CategoryInfo } from '~/types/products';

const isNative = () => Capacitor.isNativePlatform();

export const categoriesApi = {
  getAll: async (
    page = 1,
    limit = 20,
    options: { search?: string; dateFrom?: string; dateTo?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {},
    filters: ActiveFilter[] = []
  ): Promise<CategoriesResponse> => {
    if (isNative()) {
      const storage = await getStorage();
      const all = await getAllCategories<CategoryInfo & Record<string, unknown>>(storage, { search: options.search });
      const start = (page - 1) * limit;
      const pageItems = all.slice(start, start + limit);
      return {
        success: true,
        data: {
          data: pageItems as any,
          meta: { page, limit, total: all.length, totalPages: Math.ceil(all.length / limit) || 1 },
        },
        timestamp: new Date().toISOString(),
      };
    }
    const { data } = await apiClient.get('/categories', { params: { page, limit, ...options, ...filtersToParams(filters) } });
    return data;
  },

  getById: async (id: string): Promise<CategoryDetailResponse> => {
    const { data } = await apiClient.get(`/categories/${id}`);
    return data;
  },
  /** Создание/правка категории — только онлайн (редко используется, справочник). */
  create: async (formData: FormData) => {
    const { data } = await apiClient.post('/categories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  update: async ({ formData, id }: { formData: FormData; id: string }) => {
    const { data } = await apiClient.patch(`/categories/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },
};
