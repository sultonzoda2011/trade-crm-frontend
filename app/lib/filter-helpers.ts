import type { TFunction } from 'i18next';
import type { DateRangeFilterConfig, SelectFilterConfig } from '~/types/filters';

export function createDateRangeFilter(t: TFunction): DateRangeFilterConfig {
  return {
    type: 'date-range',
    keyFrom: 'dateFrom',
    keyTo: 'dateTo',
    label: t('filters.dateRange'),
  };
}

export function createSortByFilter(
  t: TFunction,
  options: { value: unknown; label: string }[]
): SelectFilterConfig {
  return {
    type: 'select',
    key: 'sortBy',
    label: t('filters.sortBy'),
    placeholder: t('filters.sortBy'),
    options,
  };
}

export function createSortOrderFilter(t: TFunction): SelectFilterConfig {
  return {
    type: 'select',
    key: 'sortOrder',
    label: t('filters.sortOrder'),
    placeholder: t('filters.sortOrder'),
    options: [
      { value: 'asc', label: t('filters.asc') },
      { value: 'desc', label: t('filters.desc') },
    ],
  };
}
