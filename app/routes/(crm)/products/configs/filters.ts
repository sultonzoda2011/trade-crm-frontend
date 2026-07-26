import type { TFunction } from 'i18next';
import type { FilterConfig } from '~/types/filters';

export const getProductFilters = (
  t: TFunction,
  categoryOptions?: { value: unknown; label: string }[]
): FilterConfig[] => {
  const config: FilterConfig[] = [];

  if (categoryOptions && categoryOptions.length > 0) {
    config.push({
      type: 'select',
      key: 'categoryId',
      label: t('filters.category'),
      placeholder: t('filters.all', { ns: 'common' }),
      options: categoryOptions,
    });
  }

  config.push(
    {
      type: 'boolean',
      key: 'lowStock',
      label: t('lowStock'),
      trueLabel: t('lowStock'),
    },
    {
      type: 'number-range',
      keyFrom: 'priceMin',
      keyTo: 'priceMax',
      label: t('filters.priceRange'),
      placeholderFrom: t('filters.min'),
      placeholderTo: t('filters.max'),
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
        { value: 'price', label: t('filters.price') },
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
