import type { TFunction } from 'i18next';
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
];
