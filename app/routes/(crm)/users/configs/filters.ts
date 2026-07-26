import type { TFunction } from 'i18next';
import { getRoleOptions } from '~/config/enumOptions';
import type { FilterConfig } from '~/types/filters';

export const getUserFilters = (
  t: TFunction,
  marketOptions?: { value: unknown; label: string }[]
): FilterConfig[] => {
  const config: FilterConfig[] = [
    {
      type: 'select',
      key: 'role',
      label: t('fields.role'),
      placeholder: t('filters.all'),
      options: getRoleOptions(t),
    },
  ];

  if (marketOptions && marketOptions.length > 0) {
    config.push({
      type: 'select',
      key: 'marketId',
      label: t('fields.market'),
      placeholder: t('filters.all', { ns: 'common' }),
      options: marketOptions,
    });
  }

  config.push(
    {
      type: 'boolean',
      key: 'isOwner',
      label: t('isOwner'),
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
        { value: 'email', label: t('filters.email') },
        { value: 'role', label: t('filters.role') },
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
  );

  return config;
};
