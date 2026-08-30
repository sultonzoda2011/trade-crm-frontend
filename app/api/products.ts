import { apiClient } from '~/lib/client';
import { filtersToParams } from '~/lib/filtersToParams';
import { listRecords } from '~/lib/offline/db';
import { createProductOffline } from '~/lib/offline/offlineProducts';
import { getIsOnline } from '~/lib/offline/networkStatus';
import { enqueueOutbox } from '~/lib/offline/outbox';
import type { OfflineProduct } from '~/lib/offline/types';
import type { ActiveFilter } from '~/types/filters';
import type { Product, ProductDetailResponse, ProductsResponse } from '~/types/products';

const isOffline = (): boolean => !getIsOnline();

/**
 * category/market/_count/metrics — то, что обычный /products досчитывает
 * поверх сырой строки Prisma. Офлайн это недоступно (это не хранится в
 * /sync/pull, чтобы не раздувать снапшот), но форме создания транзакции
 * нужны только id/name/price/quantity — остальное безопасно заглушить.
 */
function toProductStub(p: OfflineProduct): Product {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? '',
    price: p.price,
    quantity: p.quantity,
    unit: p.unit,
    lowStockThreshold: p.lowStockThreshold,
    image: p.image,
    marketId: p.marketId,
    categoryId: p.categoryId,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    market: null,
    category: null,
    _count: { transactionItems: 0 },
    metrics: null,
  } as unknown as Product;
}

export const productsApi = {
  getAll: async (
    page = 1,
    limit = 20,
    options: { search?: string; dateFrom?: string; dateTo?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {},
    filters: ActiveFilter[] = []
  ): Promise<ProductsResponse> => {
    if (isOffline()) {
      const all = await listRecords<OfflineProduct>('products');
      const search = options.search?.trim().toLowerCase();
      const filtered = search ? all.filter((p) => p.name.toLowerCase().includes(search)) : all;
      const start = (page - 1) * limit;
      const pageItems = filtered.slice(start, start + limit).map(toProductStub);
      return {
        success: true,
        data: {
          data: pageItems,
          meta: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) || 1 },
        },
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
    const { data } = await apiClient.get(`/products/${id}`);
    return data;
  },
  create: async (formData: FormData) => {
    if (isOffline()) {
      const { product, outboxBody } = await createProductOffline(formData);
      await enqueueOutbox({
        method: 'post',
        url: '/products',
        body: outboxBody,
        entity: 'products',
        localId: product.id,
      });
      return { success: true, data: toProductStub(product), timestamp: product.createdAt };
    }
    const { data } = await apiClient.post('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
  update: async ({ formData, id }: { formData: FormData; id: string }) => {
    const { data } = await apiClient.patch(`/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },
};
