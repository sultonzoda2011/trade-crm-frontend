import { create } from 'zustand';
import type { ActiveFilter } from '~/types/filters';

export interface TableStoreState {
  page: number;
  limit: number;
  search: string;
  filters: ActiveFilter[];
  activeFiltersCount: number;

  setPage: (page: number) => void;
  setLimit: (size: number) => void;
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

export function createTableStore({ initiallimit = 10 }: { initiallimit?: number } = {}) {
  return create<TableStoreState>((set) => ({
    page: 1,
    limit: initiallimit,
    search: '',
    filters: [],
    activeFiltersCount: 0,

    setPage: (page) => set({ page }),
    setLimit: (limit) => set({ limit, page: 1 }),
    setSearch: (search) => set({ search, page: 1 }),

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

    setFilters: (filters) => set({ filters, page: 1, activeFiltersCount: filters.length }),

    resetFilters: () => set({ filters: [], page: 1, activeFiltersCount: 0 }),
  }));
}
