import type { TFunction } from 'i18next';
import { createSortByFilter, createSortOrderFilter } from '~/lib/filter-helpers';
import type { FilterConfig } from '~/types/filters';

/**
 * Фильтры продавцов. `status` и `period` дублируют быстрые чипсы под поиском — они здесь,
 * чтобы шторка, чипсы и URL читали одно и то же. Произвольного диапазона дат нет: статистика
 * считается за окно «сегодня / неделя / месяц / год».
 */
export const getSellerFilters = (t: TFunction): FilterConfig[] => [
  {
    type: 'select',
    key: 'status',
    label: t('quick.show'),
    placeholder: t('status.active'),
    options: [
      { value: 'active', label: t('status.active') },
      { value: 'disabled', label: t('status.disabled') },
      { value: 'all', label: t('status.all') },
    ],
  },
  {
    type: 'select',
    key: 'period',
    label: t('quick.period'),
    placeholder: t('period.month'),
    options: [
      { value: 'today', label: t('period.today') },
      { value: 'week', label: t('period.week') },
      { value: 'month', label: t('period.month') },
      { value: 'year', label: t('period.year') },
    ],
  },
  createSortByFilter(t, [
    { value: 'balance', label: t('filters.balance') },
    { value: 'sold', label: t('filters.sold') },
    { value: 'earned', label: t('filters.earned') },
    { value: 'lastSaleAt', label: t('filters.lastSaleAt') },
    { value: 'name', label: t('filters.name') },
    { value: 'createdAt', label: t('filters.createdAt') },
  ]),
  createSortOrderFilter(t),
];
