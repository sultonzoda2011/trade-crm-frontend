import type { TFunction } from 'i18next';
import { getRoleOptions } from '~/config/enumOptions';
import type { FilterConfig } from '~/types/filters';

export const getUserFilters = (t: TFunction): FilterConfig[] => [
  {
    type: 'select',
    key: 'role',
    label: t('fields.role'),
    placeholder: t('filters.all'),
    options: getRoleOptions(t),
  },
];
