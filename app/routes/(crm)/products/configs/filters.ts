import type { TFunction } from 'i18next';
import { getProductHealthOptions, getReorderPriorityOptions } from '~/config/analyticsBadges';
import { PERIOD_OPTIONS } from '~/config/period';
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
    // Вычисляемое состояние товара. Значения — энумы бэкенда как есть,
    // поэтому ссылки с дашборда (?health=…, ?reorderPriority=…) сюда попадают.
    {
      type: 'select',
      key: 'health',
      label: t('filters.health'),
      placeholder: t('filters.all', { ns: 'common' }),
      options: getProductHealthOptions(t),
    },
    {
      type: 'select',
      key: 'reorderPriority',
      label: t('filters.reorderPriority'),
      placeholder: t('filters.all', { ns: 'common' }),
      options: getReorderPriorityOptions(t),
    },
    {
      type: 'boolean',
      key: 'needsReorder',
      label: t('filters.needsReorder'),
      trueLabel: t('filters.needsReorder'),
    },
    // Окно расчёта скорости продаж. Это НЕ dateFrom/dateTo: те фильтруют
    // дату создания товара, здесь — период, за который считаются метрики.
    {
      type: 'select',
      key: 'period',
      label: t('filters.period'),
      placeholder: t('filters.all', { ns: 'common' }),
      options: PERIOD_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    },
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
        // Вычисляемые поля — разрешены бэкендом (ANALYTICS_SORT_FIELDS),
        // по ним запрос уходит на аналитический путь с in-memory сортировкой.
        { value: 'reorderPriority', label: t('filters.reorderPriority') },
        { value: 'daysOfStockRemaining', label: t('metrics.daysOfStock') },
        { value: 'avgDailySales', label: t('metrics.avgDailySales') },
        { value: 'netUnitsSold', label: t('metrics.netUnitsSold') },
        { value: 'unitsSold', label: t('metrics.unitsSold') },
        { value: 'revenue', label: t('metrics.revenue') },
        { value: 'returnRate', label: t('metrics.returnRate') },
        { value: 'recommendedQuantity', label: t('metrics.recommendedQuantity') },
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
