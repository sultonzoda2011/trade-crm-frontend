import { deleteRequest, detailRequest, listRequest, multipartWrites } from '~/api/crud';
import { apiClient } from '~/lib/client';
import type { ProductDetailResponse, ProductsResponse } from '~/types/products';

const BASE = '/products';

export const productsApi = {
  getAll: listRequest<ProductsResponse>(BASE),
  getById: detailRequest<ProductDetailResponse>(BASE),
  delete: deleteRequest(BASE),
  ...multipartWrites(BASE),

  /**
   * Прибавляет `quantity` к остатку на сервере. Это не `update`: форма правки
   * записывает итоговое число и затирает продажи, прошедшие за это время, а
   * здесь сумму считает сама БД (см. ProductsService.restock в бэкенде).
   */
  restock: async ({ id, quantity }: { id: string; quantity: number }): Promise<unknown> =>
    (await apiClient.post(`${BASE}/${id}/restock`, { quantity })).data,
};
