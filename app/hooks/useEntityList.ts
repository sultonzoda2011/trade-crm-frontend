import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { useMemo } from 'react';
import { toast } from 'sonner';
import type { StoreApi, UseBoundStore } from 'zustand';
import type { ListOptions } from '~/api/crud';
import { useDebounce } from '~/hooks/useDebounce';
import { splitListOptions } from '~/lib/filtersToParams';
import { queryKeys, type Entity } from '~/lib/query-keys';
import type { ModalSlice } from '~/store/createModalStore';
import type { TableStoreState } from '~/store/useTableStore';
import type { ActiveFilter } from '~/types/filters';
import type { ApiResponse, PaginatedData } from '~/types/common';

export interface EntityListApi<TRow> {
  getAll: (
    page: number,
    limit: number,
    options: ListOptions,
    filters: ActiveFilter[]
  ) => Promise<ApiResponse<PaginatedData<TRow>>>;
  delete: (id: string) => Promise<unknown>;
}

export interface UseEntityListArgs<TRow, TDisplayRow = TRow> {
  /** Registry entity — decides the query-key family and the invalidation prefix. */
  entity: Entity;
  /** The route's own scoped table store, per the `createTableStore()` convention. */
  store: UseBoundStore<StoreApi<TableStoreState>>;
  api: EntityListApi<TRow>;
  /** The page's translated `t`, so delete toasts keep the entity namespace. */
  t: TFunction;
  /** The route's `delete` modal slice. */
  deleteModal: ModalSlice<string>;
  /**
   * Optional row transformer (e.g. merging offline overlay rows on debtors/transactions).
   * Receives the raw server rows and the query's `dataUpdatedAt` timestamp.
   */
  transformRows?: (serverRows: TRow[], meta: { dataUpdatedAt: number; debouncedSearch: string }) => TDisplayRow[];
}

/**
 * Everything a list page does around its table: read the scoped store, debounce
 * search, build the list query, and run the delete mutation.
 *
 * Seven pages carried byte-identical copies of this — the store destructure, the
 * debounced search, the `queryFn` that splits option keys out of the active
 * filters, and the delete mutation with its invalidate → toast → close chain.
 * Storing the whole `{ page, limit, search, filters }` object also meant each
 * page subscribed to the entire Zustand store and re-rendered on any field
 * change; the selectors here take one slice each.
 */
export function useEntityList<TRow, TDisplayRow = TRow>({
  entity,
  store,
  api,
  t,
  deleteModal,
  transformRows,
}: UseEntityListArgs<TRow, TDisplayRow>) {
  const page = store((s) => s.page);
  const limit = store((s) => s.limit);
  const search = store((s) => s.search);
  const filters = store((s) => s.filters);
  const setPage = store((s) => s.setPage);
  const setLimit = store((s) => s.setLimit);
  const setSearch = store((s) => s.setSearch);
  const setFilter = store((s) => s.setFilter);
  const setFilters = store((s) => s.setFilters);
  const removeFilter = store((s) => s.removeFilter);
  const resetFilters = store((s) => s.resetFilters);

  const debouncedSearch = useDebounce(search);

  const queryClient = useQueryClient();

  const {
    data: response,
    dataUpdatedAt,
    isLoading,
    isFetching,
    isError,
    fetchStatus,
  } = useQuery({
    queryKey: queryKeys.list(entity, { page, limit, search: debouncedSearch, filters }),
    queryFn: () => {
      const { options, activeFilters } = splitListOptions(filters, debouncedSearch);
      return api.getAll(page, limit, options, activeFilters);
    },
    staleTime: 30_000,
  });

  const { mutate: deleteOne, isPending: isDeletePending } = useMutation({
    mutationFn: (id: string) => api.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.entity(entity) });
      toast.success(t('actions.deleteSuccess'));
      deleteModal.close();
    },
    onError: () => {
      toast.error(t('actions.deleteError'));
    },
  });

  const serverRows = useMemo(() => response?.data?.data ?? [], [response]);
  const rows = useMemo<TDisplayRow[]>(
    () =>
      transformRows
        ? transformRows(serverRows, { dataUpdatedAt, debouncedSearch })
        : (serverRows as unknown as TDisplayRow[]),
    [serverRows, transformRows, dataUpdatedAt, debouncedSearch]
  );
  const totalPages = response?.data?.meta?.totalPages || 1;
  // Запрос ни разу не загрузился и сейчас на паузе из-за офлайна (см.
  // app/lib/network-status.ts) — отличаем от "список реально пуст", чтобы
  // DataTable не показывал это как "записей нет".
  const isOfflineEmpty = fetchStatus === 'paused' && !response;

  /** Spread straight onto `<ConfirmDialog>`. */
  const deleteDialog = {
    open: deleteModal.isOpen,
    onOpenChange: (open: boolean) => {
      if (!open) deleteModal.close();
    },
    onConfirm: () => {
      if (deleteModal.data != null) deleteOne(deleteModal.data);
    },
    isLoading: isDeletePending,
    title: t('actions.confirm'),
    description: t('actions.areYouSure'),
  };

  return {
    rows,
    serverRows,
    dataUpdatedAt,
    debouncedSearch,
    totalPages,
    isLoading,
    isFetching,
    isError,
    isOfflineEmpty,
    page,
    limit,
    search,
    filters,
    setPage,
    setLimit,
    setSearch,
    setFilter,
    setFilters,
    removeFilter,
    resetFilters,
    deleteDialog,
  };
}

export type EntityListResult<TRow> = ReturnType<typeof useEntityList<any, TRow>>;
