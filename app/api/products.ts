import { isOfflineCapable } from '~/lib/offline/platform';
import { getAllProducts, getProductById } from '@trade-crm/offline-core';
import { apiClient } from '~/lib/client';
import { filtersToParams } from '~/lib/filtersToParams';
import { getStorage } from '~/lib/offline/storage';
import type { ActiveFilter } from '~/types/filters';
import type { Product, ProductDetailResponse, ProductsResponse } from '~/types/products';

export const productsApi = {
  getAll: async (
    page = 1,
    limit = 20,
    options: { search?: string; dateFrom?: string; dateTo?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {},
    filters: ActiveFilter[] = []
  ): Promise<ProductsResponse> => {
    if (isOfflineCapable()) {
      const storage = await getStorage();
      const { items, total } = await getAllProducts<Product>(storage, { search: options.search, page, limit });
      return {
        success: true,
        data: { data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } },
        timestamp: new Date().toISOString(),
      };
    }
    const { data } = await apiClient.get('/products', {
      params: {
        page,
        limit,
        ...options,
        ...filtersToParams(filters),
      },
    });
    return data;
  },

  getById: async (id: string): Promise<ProductDetailResponse> => {
    if (isOfflineCapable()) {
      const storage = await getStorage();
      const product = await getProductById(storage, id);
      if (!product) throw new Error(`Product ${id} not found locally`);
      return { success: true, data: product as any, timestamp: new Date().toISOString() };
    }
    const { data } = await apiClient.get(`/products/${id}`);
    return data;
  },

  /** Создание/редактирование товара — только онлайн (см. обсуждение архитектуры:
   *  цену/остаток трогает только сервер, чтобы не было last-write-wins на складе).
   *  UI должен блокировать форму, если !online. */
  create: async (formData: FormData) => {
    const { data } = await apiClient.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  update: async ({ formData, id }: { formData: FormData; id: string }) => {
    const { data } = await apiClient.patch(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },
};
