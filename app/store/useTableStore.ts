import { create } from 'zustand';
import type { ActiveFilter } from '~/types/filters';

export interface TableStoreState {
  pageNumber: number;
  pageSize: number;
  search: string;
  filters: ActiveFilter[];
  activeFiltersCount: number;

  setPageNumber: (pageNumber: number) => void;
  setPageSize: (size: number) => void;
  setSearch: (value: string) => void;
  setFilter: (key: string, value: any) => void;
  removeFilter: (key: string) => void;
  setFilters: (filters: ActiveFilter[]) => void;
  resetFilters: () => void;
}

function applyFilter(filters: ActiveFilter[], key: string, value: any): ActiveFilter[] {
  const isEmpty = value === '' || value == null;
  if (isEmpty) return filters.filter((f) => f.key !== key);
  const exists = filters.some((f) => f.key === key);
  return exists ? filters.map((f) => (f.key === key ? { key, value } : f)) : [...filters, { key, value }];
}

export function createTableStore({ initialPageSize = 10 }: { initialPageSize?: number } = {}) {
  return create<TableStoreState>((set) => ({
    pageNumber: 1,
    pageSize: initialPageSize,
    search: '',
    filters: [],
    activeFiltersCount: 0,

    setPageNumber: (pageNumber) => set({ pageNumber }),
    setPageSize: (pageSize) => set({ pageSize, pageNumber: 1 }),
    setSearch: (search) => set({ search, pageNumber: 1 }),

    setFilter: (key, value) =>
      set((state) => {
        const filters = applyFilter(state.filters, key, value);
        return { filters, page: 1, activeFiltersCount: filters.length };
      }),

    removeFilter: (key) =>
      set((state) => {
        const filters = state.filters.filter((f) => f.key !== key);
        return { filters, activeFiltersCount: filters.length };
      }),

    setFilters: (filters) => set({ filters, pageNumber: 1, activeFiltersCount: filters.length }),

    resetFilters: () => set({ filters: [], pageNumber: 1, activeFiltersCount: 0 }),
  }));
}
