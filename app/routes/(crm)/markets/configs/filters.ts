import type { TFunction } from 'i18next';
import { createDateRangeFilter, createSortByFilter, createSortOrderFilter } from '~/lib/filter-helpers';
import type { FilterConfig } from '~/types/filters';

export const getMarketFilters = (t: TFunction, ownerOptions?: { value: unknown; label: string }[]): FilterConfig[] => {
  const config: FilterConfig[] = [];

  if (ownerOptions && ownerOptions.length > 0) {
    config.push({
      type: 'select',
      key: 'ownerId',
      label: t('fields.owner'),
      placeholder: t('filters.all', { ns: 'common' }),
      options: ownerOptions,
    });
  }

  config.push(
    {
      type: 'boolean',
      key: 'hasUsers',
      label: t('hasUsers'),
    },
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
    createSortOrderFilter(t)
  );

  return config;
};
