import { apiClient } from '~/lib/client';
import { filtersToParams } from '~/lib/filtersToParams';
import type { ActiveFilter } from '~/types/filters';
import type { ProductDetailResponse, ProductsResponse } from '~/types/products';

export const productsApi = {
  getAll: async (page = 1, limit = 20, filters: ActiveFilter[] = []): Promise<ProductsResponse> => {
    const { data } = await apiClient.get('/products', {
      params: {
        page,
        limit,
        ...filtersToParams(filters),
      },
    });

    return data;
  },

  getById: async (id: number): Promise<ProductDetailResponse> => {
    const { data } = await apiClient.get(`/products/${id}`);
    return data;
  },
  create: async (formData: FormData) => {
    const { data } = await apiClient.post('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
  update: async ({ formData, id }: { formData: FormData; id: number }) => {
    const { data } = await apiClient.patch(`/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },
};
