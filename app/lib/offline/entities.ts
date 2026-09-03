import { categoriesApi } from '~/api/categories';
import { debtorsApi } from '~/api/debtors';
import { marketsApi } from '~/api/markets';
import { productsApi } from '~/api/products';
import { sellersApi } from '~/api/sellers';
import { transactionsApi } from '~/api/transactions';

// Список синхронизируемых сущностей для /sync/<entity>. limit=10 — это тот
// же дефолт, что и у обычных списков (см. useTableStore: initiallimit=10),
// без активного поиска/фильтров/сортировки. Это осознанное ограничение:
// офлайн гарантированно работает для "обычного" пролистывания списка
// (страница 1, 2, 3...), а не для произвольной комбинации поиска/фильтров —
// таких комбинаций бесконечно много, закэшировать их все заранее нельзя.
export interface SyncEntityConfig {
  key: string;
  labelKey: string; // ключ в public/locales/*/sync.json
  hasDetail: boolean;
  listLimit: number;
  listFn: (page: number, limit: number) => Promise<{ data: { data: any[]; meta: { totalPages: number } } }>;
  detailFn?: (id: string) => Promise<unknown>;
  getId: (item: any) => string;
}

export const SYNC_ENTITIES: SyncEntityConfig[] = [
  {
    key: 'products',
    labelKey: 'entities.products',
    hasDetail: true,
    listLimit: 10,
    listFn: (page, limit) => productsApi.getAll(page, limit) as any,
    detailFn: (id) => productsApi.getById(id),
    getId: (item) => item.id,
  },
  {
    key: 'transactions',
    labelKey: 'entities.transactions',
    hasDetail: true,
    listLimit: 10,
    listFn: (page, limit) => transactionsApi.getAll(page, limit) as any,
    detailFn: (id) => transactionsApi.getById(id),
    getId: (item) => item.id,
  },
  {
    key: 'debtors',
    labelKey: 'entities.debtors',
    hasDetail: true,
    listLimit: 10,
    listFn: (page, limit) => debtorsApi.getAll(page, limit) as any,
    detailFn: (id) => debtorsApi.getById(id),
    getId: (item) => item.id,
  },
  {
    key: 'categories',
    labelKey: 'entities.categories',
    hasDetail: true,
    listLimit: 10,
    listFn: (page, limit) => categoriesApi.getAll(page, limit) as any,
    detailFn: (id) => categoriesApi.getById(id),
    getId: (item) => item.id,
  },
  {
    key: 'markets',
    labelKey: 'entities.markets',
    hasDetail: true,
    listLimit: 10,
    listFn: (page, limit) => marketsApi.getAll(page, limit) as any,
    detailFn: (id) => marketsApi.getById(id),
    getId: (item) => item.id,
  },
  {
    key: 'sellers',
    labelKey: 'entities.sellers',
    hasDetail: true,
    listLimit: 10,
    listFn: (page, limit) => sellersApi.getAll(page, limit) as any,
    detailFn: (id) => sellersApi.getById(id),
    getId: (item) => item.id,
  },
];

export function getSyncEntity(key: string): SyncEntityConfig | undefined {
  return SYNC_ENTITIES.find((e) => e.key === key);
}
