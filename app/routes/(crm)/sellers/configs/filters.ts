import type { TFunction } from 'i18next';
import { createDateRangeFilter, createSortByFilter, createSortOrderFilter } from '~/lib/filter-helpers';
import type { FilterConfig } from '~/types/filters';

export const getSellerFilters = (t: TFunction): FilterConfig[] => [
  createSortOrderFilter(t),
  createDateRangeFilter(t),
  createSortByFilter(t, [
    { value: 'createdAt', label: t('filters.createdAt') },
    { value: 'name', label: t('filters.name') },
  ]),
];
