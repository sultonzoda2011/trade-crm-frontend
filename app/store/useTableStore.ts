import { create } from 'zustand';
import type { ActiveFilter } from '~/types/filters';

/**
 * The one default page size. `createTableStore`, the query-string sync in
 * `useFilterParams` and anything else that needs "the limit when nobody chose
 * one" must read this — it used to be spelled 10, 10 and 20 in three places.
 */
export const DEFAULT_PAGE_LIMIT = 10;

export interface TableStoreState {
  page: number;
  limit: number;
  search: string;
  filters: ActiveFilter[];

  setPage: (page: number) => void;
  setLimit: (size: number) => void;
  setSearch: (value: string) => void;
  setFilter: (key: string, value: ActiveFilter['value']) => void;
  /** Drops one filter without resetting the page — deleting a filter legitimately keeps you where you were. */
  removeFilter: (key: string) => void;
  setFilters: (filters: ActiveFilter[]) => void;
  resetFilters: () => void;
}

/** Add, replace or drop-one a filter by key. Shared with `FilterSheet`'s local draft state. */
export function applyFilter(filters: ActiveFilter[], key: string, value: ActiveFilter['value']): ActiveFilter[] {
  const isEmpty = value === '' || value == null;
  if (isEmpty) return filters.filter((f) => f.key !== key);
  const exists = filters.some((f) => f.key === key);
  return exists ? filters.map((f) => (f.key === key ? { key, value } : f)) : [...filters, { key, value }];
}

export function createTableStore() {
  return create<TableStoreState>((set) => ({
    page: 1,
    limit: DEFAULT_PAGE_LIMIT,
    search: '',
    filters: [],

    setPage: (page) => set({ page }),
    setLimit: (limit) => set({ limit, page: 1 }),
    setSearch: (search) => set({ search, page: 1 }),

    setFilter: (key, value) => set((state) => ({ filters: applyFilter(state.filters, key, value), page: 1 })),

    removeFilter: (key) => set((state) => ({ filters: state.filters.filter((f) => f.key !== key) })),

    setFilters: (filters) => set({ filters, page: 1 }),

    resetFilters: () => set({ filters: [], page: 1 }),
  }));
}
