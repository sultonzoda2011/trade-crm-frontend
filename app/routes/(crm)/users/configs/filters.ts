import type { TFunction } from 'i18next';
import { getRoleFilterOptions } from '~/config/enumOptions';
import { createDateRangeFilter, createSortByFilter, createSortOrderFilter } from '~/lib/filter-helpers';
import type { FilterConfig } from '~/types/filters';

export const getUserFilters = (t: TFunction, marketOptions?: { value: unknown; label: string }[]): FilterConfig[] => {
  const config: FilterConfig[] = [
    {
      type: 'select',
      key: 'role',
      label: t('fields.role'),
      placeholder: t('filters.all'),
      options: getRoleFilterOptions(t),
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
    createDateRangeFilter(t),
    createSortByFilter(t, [
      { value: 'createdAt', label: t('filters.createdAt') },
      { value: 'name', label: t('filters.name') },
      { value: 'email', label: t('filters.email') },
      { value: 'role', label: t('filters.role') },
    ]),
    createSortOrderFilter(t)
  );

  return config;
};
