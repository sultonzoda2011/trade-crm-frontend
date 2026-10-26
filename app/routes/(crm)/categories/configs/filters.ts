import type { TFunction } from 'i18next';
import { createDateRangeFilter, createSortByFilter, createSortOrderFilter } from '~/lib/filter-helpers';
import type { FilterConfig } from '~/types/filters';

export const getCategoryFilters = (t: TFunction): FilterConfig[] => [
  {
    type: 'boolean',
    key: 'hasProducts',
    label: t('hasProducts'),
  },
  createDateRangeFilter(t),
  createSortByFilter(t, [
    { value: 'createdAt', label: t('filters.createdAt') },
    { value: 'name', label: t('filters.name') },
  ]),
  createSortOrderFilter(t),
];
