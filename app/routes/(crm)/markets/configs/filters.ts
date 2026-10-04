import type { TFunction } from 'i18next';
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
    }
  );

  return config;
};
