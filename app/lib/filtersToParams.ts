import type { ListOptions } from '~/api/crud';
import type { ActiveFilter } from '~/types/filters';

/**
 * The filter keys the list endpoints accept as `options` rather than as active
 * filters — every list page used to re-derive these five lines in its own
 * `queryFn`, identically.
 */
export const LIST_OPTION_KEYS = ['dateFrom', 'dateTo', 'sortBy', 'sortOrder'] as const;

/** Сортировка, когда пользователь не выбрал свою. Для большинства списков — «новые сверху». */
export interface DefaultSort {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const DEFAULT_LIST_SORT: DefaultSort = { sortBy: 'createdAt', sortOrder: 'desc' };

export function splitListOptions(
  filters: ActiveFilter[],
  debouncedSearch: string,
  defaultSort: DefaultSort = DEFAULT_LIST_SORT
): { options: ListOptions; activeFilters: ActiveFilter[] } {
  const read = (key: (typeof LIST_OPTION_KEYS)[number]) => filters.find((f) => f.key === key)?.value;
  const options: ListOptions = {
    search: debouncedSearch || undefined,
    dateFrom: read('dateFrom') as string | undefined,
    dateTo: read('dateTo') as string | undefined,
    sortBy: (read('sortBy') as string) || defaultSort.sortBy,
    sortOrder: (read('sortOrder') as 'asc' | 'desc') || defaultSort.sortOrder,
  };
  const activeFilters = filters.filter((f) => !LIST_OPTION_KEYS.includes(f.key as (typeof LIST_OPTION_KEYS)[number]));
  return { options, activeFilters };
}

export function filtersToParams<T extends Record<string, unknown>>(filters: ActiveFilter[]): T {
  return filters.reduce((acc, { key, value }) => {
    if (value === undefined || value === null) return acc;
    return { ...acc, [key]: value };
  }, {} as T);
}

