import type { TFunction } from 'i18next';
import { createDateRangeFilter, createSortByFilter, createSortOrderFilter } from '~/lib/filter-helpers';
import type { FilterConfig } from '~/types/filters';

export const getDebtorFilters = (t: TFunction): FilterConfig[] => [
  {
    type: 'boolean',
    key: 'hasActiveDebts',
    label: t('hasActiveDebts'),
  },
  {
    type: 'boolean',
    key: 'overdue',
    label: t('overdue'),
  },
  {
    type: 'select',
    key: 'risk',
    label: t('risk.title'),
    placeholder: t('filters.all', { ns: 'common' }),
    options: [
      { value: 'HIGH', label: t('risk.HIGH') },
      { value: 'MEDIUM', label: t('risk.MEDIUM') },
      { value: 'LOW', label: t('risk.LOW') },
    ],
  },
  {
    type: 'number-range',
    keyFrom: 'minDebtAmount',
    keyTo: 'maxDebtAmount',
    label: t('totalDebtAmount'),
    placeholderFrom: t('filters.min', { ns: 'common' }),
    placeholderTo: t('filters.max', { ns: 'common' }),
  },
  createDateRangeFilter(t),
  createSortByFilter(t, [
    { value: 'createdAt', label: t('filters.createdAt') },
    { value: 'name', label: t('filters.name') },
  ]),
  createSortOrderFilter(t),
];
