import { deleteRequest, detailRequest, listRequest, multipartWrites } from '~/api/crud';
import { apiClient } from '~/lib/client';
import type {
  BulkPricePayload,
  BulkPriceResponse,
  ProductDetailResponse,
  ProductsResponse,
  ProductsSummaryResponse,
  StockMovementsResponse,
  StockMovementType,
  WriteOffReason,
} from '~/types/products';

const BASE = '/products';

export const productsApi = {
  getAll: listRequest<ProductsResponse>(BASE),
  getById: detailRequest<ProductDetailResponse>(BASE),
  delete: deleteRequest(BASE),
  ...multipartWrites(BASE),

  /**
   * Прибавляет `quantity` к остатку на сервере. Это не `update`: сумму считает сама БД
   * (см. ProductsService.restock в бэкенде), поэтому продажи, прошедшие за это время, не затираются.
   */
  restock: async ({ id, quantity, note }: { id: string; quantity: number; note?: string }): Promise<unknown> =>
    (await apiClient.post(`${BASE}/${id}/restock`, { quantity, note })).data,

  /** Списание: порча, срок, потеря, себе, другое. Остаток уменьшает сервер, минус не допускается. */
  writeOff: async ({
    id,
    quantity,
    reason,
    note,
  }: {
    id: string;
    quantity: number;
    reason: WriteOffReason;
    note?: string;
  }): Promise<unknown> => (await apiClient.post(`${BASE}/${id}/write-off`, { quantity, reason, note })).data,

  /**
   * Пересчёт: «на полке N». `quantity` — итог, не прибавка; разницу с учётным остатком сервер пишет
   * в журнал. Если остаток поменялся между чтением и записью (продажа), сервер отвечает 409
   * PRODUCT_STOCK_CHANGED с `details.currentQuantity` — надо пересчитать.
   */
  adjust: async ({ id, quantity, note }: { id: string; quantity: number; note?: string }): Promise<unknown> =>
    (await apiClient.post(`${BASE}/${id}/adjust`, { quantity, note })).data,

  archive: async (id: string): Promise<unknown> => (await apiClient.post(`${BASE}/${id}/archive`)).data,
  unarchive: async (id: string): Promise<unknown> => (await apiClient.post(`${BASE}/${id}/unarchive`)).data,

  getMovements: async (
    id: string,
    params: { page?: number; limit?: number; type?: StockMovementType } = {}
  ): Promise<StockMovementsResponse> => (await apiClient.get(`${BASE}/${id}/movements`, { params })).data,

  getSummary: async (): Promise<ProductsSummaryResponse> => (await apiClient.get(`${BASE}/summary`)).data,

  /** `dryRun: true` ничего не пишет и возвращает первые 20 изменений. */
  bulkPrice: async (payload: BulkPricePayload): Promise<BulkPriceResponse> =>
    (await apiClient.post(`${BASE}/bulk-price`, payload)).data,
};
