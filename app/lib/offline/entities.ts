import { categoriesApi } from '~/api/categories';
import { debtorsApi } from '~/api/debtors';
import { marketsApi } from '~/api/markets';
import { productsApi } from '~/api/products';
import { sellersApi } from '~/api/sellers';
import { transactionsApi } from '~/api/transactions';
import { Role } from '~/types/common';

// Список синхронизируемых сущностей для /sync/<entity>. limit=10 — это тот
// же дефолт, что и у обычных списков (см. useTableStore: initiallimit=10),
// без активного поиска/фильтров/сортировки. Это осознанное ограничение:
// офлайн гарантированно работает для "обычного" пролистывания списка
// (страница 1, 2, 3...), а не для произвольной комбинации поиска/фильтров —
// таких комбинаций бесконечно много, закэшировать их все заранее нельзя.
//
// roles — те же роли, что и у настоящего роута сущности в
// app/config/permissions.ts (ROUTE_PERMISSIONS). Не выдумываем отдельную
// матрицу прав для офлайн-раздела: у кого нет доступа к /markets, у того
// нет доступа и к /sync/markets — ни в списке на /sync, ни при прямом
// переходе по ссылке (второе гарантирует сам permissions.ts).
//
// detailUrl нужен, чтобы читать уже закэшированный ответ детальной карточки
// БЕЗ сетевого запроса (readCache работает по точному URL) — это основа
// "умного" обновления карточек: если у записи в свежем списке updatedAt не
// изменился с последнего кэша — заново её не тянем.
export interface SyncEntityConfig {
  key: string;
  labelKey: string; // ключ в public/locales/*/sync.json
  hasDetail: boolean;
  listLimit: number;
  roles: Role[];
  listFn: (page: number, limit: number) => Promise<{ data: { data: any[]; meta: { totalPages: number } } }>;
  detailFn?: (id: string) => Promise<unknown>;
  detailUrl?: (id: string) => string;
  getId: (item: any) => string;
  /** Если сущность не отдаёт updatedAt (сейчас — sellers), умный пропуск недоступен: карточка обновляется каждый раз. */
  getUpdatedAt?: (item: any) => string | undefined;
}

export const SYNC_ENTITIES: SyncEntityConfig[] = [
  {
    key: 'products',
    labelKey: 'entities.products',
    hasDetail: true,
    listLimit: 10,
    roles: [Role.Admin, Role.Owner, Role.Seller],
    listFn: (page, limit) => productsApi.getAll(page, limit) as any,
    detailFn: (id) => productsApi.getById(id),
    detailUrl: (id) => `/products/${id}`,
    getId: (item) => item.id,
    getUpdatedAt: (item) => item.updatedAt,
  },
  {
    key: 'transactions',
    labelKey: 'entities.transactions',
    hasDetail: true,
    listLimit: 10,
    roles: [Role.Admin, Role.Owner, Role.Seller],
    listFn: (page, limit) => transactionsApi.getAll(page, limit) as any,
    detailFn: (id) => transactionsApi.getById(id),
    detailUrl: (id) => `/transactions/${id}/detail`,
    getId: (item) => item.id,
    getUpdatedAt: (item) => item.updatedAt,
  },
  {
    key: 'debtors',
    labelKey: 'entities.debtors',
    hasDetail: true,
    listLimit: 10,
    roles: [Role.Admin, Role.Owner, Role.Seller],
    listFn: (page, limit) => debtorsApi.getAll(page, limit) as any,
    detailFn: (id) => debtorsApi.getById(id),
    detailUrl: (id) => `/debtors/${id}`,
    getId: (item) => item.id,
    getUpdatedAt: (item) => item.updatedAt,
  },
  {
    key: 'categories',
    labelKey: 'entities.categories',
    hasDetail: true,
    listLimit: 10,
    roles: [Role.Admin, Role.Owner],
    listFn: (page, limit) => categoriesApi.getAll(page, limit) as any,
    detailFn: (id) => categoriesApi.getById(id),
    detailUrl: (id) => `/categories/${id}`,
    getId: (item) => item.id,
    getUpdatedAt: (item) => item.updatedAt,
  },
  {
    key: 'markets',
    labelKey: 'entities.markets',
    hasDetail: true,
    listLimit: 10,
    roles: [Role.Admin],
    listFn: (page, limit) => marketsApi.getAll(page, limit) as any,
    detailFn: (id) => marketsApi.getById(id),
    detailUrl: (id) => `/markets/${id}`,
    getId: (item) => item.id,
    getUpdatedAt: (item) => item.updatedAt,
  },
  {
    key: 'sellers',
    labelKey: 'entities.sellers',
    hasDetail: true,
    listLimit: 10,
    roles: [Role.Admin, Role.Owner],
    listFn: (page, limit) => sellersApi.getAll(page, limit) as any,
    detailFn: (id) => sellersApi.getById(id),
    detailUrl: (id) => `/sellers/${id}`,
    getId: (item) => item.id,
    // У Seller (тип) нет updatedAt в API-ответе — умный пропуск для этой
    // сущности недоступен, "Обновить карточки" всегда тянет всё заново.
  },
];

export function getSyncEntity(key: string): SyncEntityConfig | undefined {
  return SYNC_ENTITIES.find((e) => e.key === key);
}
