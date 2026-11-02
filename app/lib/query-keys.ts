import type { QueryClient } from '@tanstack/react-query';
import { DEFAULT_PAGE_LIMIT } from '~/store/useTableStore';
import type { ActiveFilter } from '~/types/filters';

/**
 * The only place a react-query key is spelled out.
 *
 * Before this, keys were written as array literals at 60+ call sites and had
 * drifted: `['categories', 'list']` was shared by four fetches with two
 * different page sizes (so whichever ran first decided whether the category
 * dropdown held 20 items or all of them), detail pages read `['user-full', id]`
 * while their edit twins invalidated `['user', id]`, and the report panel sat
 * outside the `['dashboard']` prefix its siblings share.
 *
 * Every key below starts with its entity, so `invalidateQueries({ queryKey:
 * queryKeys.entity('users') })` still invalidates that entity's lists, options
 * and detail caches together — prefix matching is how the mutations already
 * work, and this keeps that property rather than relying on a name accident.
 */
export type Entity = 'users' | 'markets' | 'sellers' | 'debtors' | 'products' | 'categories' | 'transactions';

/** Query params a paginated list read depends on — anything less and two pages share a cache entry. */
export interface ListQuery {
  page: number;
  limit: number;
  search?: string;
  filters?: ActiveFilter[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
}

export const queryKeys = {
  /** Broadest prefix for an entity — what a create/update/delete should invalidate. */
  entity: (entity: Entity) => [entity] as const,

  /** The paginated table itself. */
  list: (entity: Entity, query: ListQuery) => [entity, 'list', query] as const,

  /**
   * Non-paginated reference reads: combobox options, filter dropdowns, panel
   * previews, palette results. `scope` says *who* is asking, and the rest of
   * the params go into the key so two callers that fetch different page sizes
   * of the same entity no longer collide.
   */
  options: (entity: Entity, params: Record<string, unknown>) => [entity, 'options', params] as const,

  /** `GET /:id` — the compact payload an edit form loads. */
  detail: (entity: Entity, id?: string | null) => [entity, 'detail', id] as const,

  /** `GET /:id/full` (transactions: `/detail`) — the enriched payload a detail page loads. */
  full: (entity: Entity, id?: string | null) => [entity, 'full', id] as const,

  /** A nested sub-resource, e.g. a seller's balance or credit list. */
  sub: (entity: Entity, name: string, id?: string | null, params?: Record<string, unknown>) =>
    [entity, name, id, params ?? null] as const,

  /**
   * Dashboard panels, all under one prefix so a filter change can invalidate the
   * set. `params` is `object` rather than a record because the callers pass the
   * `DashboardParams` interface, which has no index signature.
   */
  dashboard: (view: 'overview' | 'stock' | 'recent-transactions' | 'sellers-report', params?: object) =>
    ['dashboard', view, params ?? null] as const,

  /** The signed-in user's own profile — the one read with no id. */
  profile: () => ['profile', 'self'] as const,

  /**
   * Compact `GET /profile` for the shell (header avatar, name). It is NOT the
   * same payload as `profile()` — the profile page loads `/profile/full` under
   * that key — so it needs its own key or the two would overwrite each other.
   */
  me: () => ['profile', 'me'] as const,

  /** Prefix for everything profile-related; use it after an edit so both reads refresh. */
  profileAll: () => ['profile'] as const,
} as const;

/**
 * Точечная инвалидация после создания, правки, оплаты или удаления записи:
 * обновляет первую страницу списка, активные таблицы, справочники (`options`),
 * сводки (`summary`) и ТОЛЬКО затронутые карточки (`ids`), не сбрасывая сотни
 * остальных карточек в офлайн-кеше.
 */
export function invalidateEntityCache(
  queryClient: QueryClient,
  entity: Entity,
  ids?: string | null | Array<string | null | undefined>
): void {
  const idList = (Array.isArray(ids) ? ids : [ids]).filter((x): x is string => Boolean(x));
  const idSet = new Set(idList);
  const firstPageKey = queryKeys.list(entity, {
    page: 1,
    limit: DEFAULT_PAGE_LIMIT,
    search: '',
    filters: [],
  });

  // 1. Активные списки на экране + справочники/сводки. Неактивные страницы 2..N
  //    офлайн-кеша не помечаем устаревшими зря.
  void queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey;
      if (key[0] !== entity) return false;
      const kind = key[1];
      if (kind === 'options' || kind === 'summary' || kind === 'debtor-open-debts') {
        return true;
      }
      if (kind === 'list') {
        return query.getObserversCount() > 0;
      }
      return false;
    },
  });

  // 2. Первая страница дефолтного списка и затронутые карточки (detail/full/ledger/balance):
  //    если они уже лежат в кеше, обновляем их и в фоне (`refetchType: 'all'`), чтобы
  //    единичная правка не требовала ручной полной синхронизации.
  void queryClient.invalidateQueries({
    refetchType: 'all',
    predicate: (query) => {
      const key = query.queryKey;
      if (key[0] !== entity) return false;
      const kind = key[1];
      if (kind === 'list') {
        const q = key[2] as ListQuery | undefined;
        return (
          q?.page === firstPageKey[2].page &&
          q?.limit === firstPageKey[2].limit &&
          (q?.search ?? '') === '' &&
          (q?.filters?.length ?? 0) === 0
        );
      }
      if (idSet.size > 0 && typeof key[2] === 'string' && idSet.has(key[2])) {
        return true;
      }
      return false;
    },
  });
}
