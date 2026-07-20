import type { ActiveFilter } from '~/types/filters';

export function filtersToParams<T extends Record<string, unknown>>(filters: ActiveFilter[]): T {
  return filters.reduce((acc, { key, value }) => {
    if (value === undefined || value === null) return acc;
    return { ...acc, [key]: value };
  }, {} as T);
}
