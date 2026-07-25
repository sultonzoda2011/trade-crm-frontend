import { apiClient } from '~/lib/client';
import type {
  CategoriesResponse,
  CategoryDetailResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '~/types/products';

export const categoriesApi = {
  getAll: async (): Promise<CategoriesResponse> => {
    const { data } = await apiClient.get('/categories');
    return data;
  },
  getById: async (id: string): Promise<CategoryDetailResponse> => {
    const { data } = await apiClient.get(`/categories/${id}`);
    return data;
  },
  create: async (request: CreateCategoryRequest): Promise<CategoryDetailResponse> => {
    const { data } = await apiClient.post('/categories', request);
    return data;
  },
  update: async ({ id, request }: { id: string; request: UpdateCategoryRequest }): Promise<CategoryDetailResponse> => {
    const { data } = await apiClient.patch(`/categories/${id}`, request);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },
};
