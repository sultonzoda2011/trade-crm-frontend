import type { TFunction } from 'i18next';
import type { FilterConfig } from '~/types/filters';

export const getSellerFilters = (t: TFunction): FilterConfig[] => [
  {
    type: 'select',
    key: 'sortOrder',
    label: t('filters.sortOrder'),
    placeholder: t('filters.sortOrder'),
    options: [
      { value: 'asc', label: t('filters.asc') },
      { value: 'desc', label: t('filters.desc') },
    ],
  },
  {
    type: 'date-range',
    keyFrom: 'dateFrom',
    keyTo: 'dateTo',
    label: t('filters.dateRange'),
  },
  {
    type: 'select',
    key: 'sortBy',
    label: t('filters.sortBy'),
    placeholder: t('filters.sortBy'),
    options: [
      { value: 'createdAt', label: t('filters.createdAt') },
      { value: 'name', label: t('filters.name') },
    ],
  },
];
