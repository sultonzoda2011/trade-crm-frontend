import { create } from 'zustand';
import type { ActiveFilter } from '~/types/filters';

export interface TableStoreState {
  page: number;
  limit: number;
  search: string;
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filters: ActiveFilter[];
  activeFiltersCount: number;

  setPage: (page: number) => void;
  setLimit: (size: number) => void;
  setSearch: (value: string) => void;
  setDateFrom: (value: string) => void;
  setDateTo: (value: string) => void;
  setSortBy: (value: string) => void;
  setSortOrder: (value: 'asc' | 'desc') => void;
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
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    filters: [],
    activeFiltersCount: 0,

    setPage: (page) => set({ page }),
    setLimit: (limit) => set({ limit, page: 1 }),
    setSearch: (search) => set({ search, page: 1 }),
    setDateFrom: (dateFrom) => set({ dateFrom, page: 1 }),
    setDateTo: (dateTo) => set({ dateTo, page: 1 }),
    setSortBy: (sortBy) => set({ sortBy }),
    setSortOrder: (sortOrder) => set({ sortOrder }),

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
