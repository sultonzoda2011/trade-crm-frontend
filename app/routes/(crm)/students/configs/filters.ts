import type { TFunction } from 'i18next';
import { getActiveStatusOptions, getGenderOptions } from '~/config/enumOptions';
import type { FilterConfig } from '~/types/filters';

export const getStudentFilters = (t: TFunction): FilterConfig[] => [
  {
    type: 'select',
    key: 'activeStatus',
    label: t('fields.status'),
    placeholder: t('filters.all'),
    options: getActiveStatusOptions(t),
  },
  {
    type: 'select',
    key: 'gender',
    label: t('fields.gender'),
    placeholder: t('filters.all'),
    options: getGenderOptions(t),
  },
  {
    type: 'number-range',
    keyFrom: 'ageFrom',
    keyTo: 'ageTo',
    label: t('fields.age'),
    placeholderFrom: t('filters.from'),
    placeholderTo: t('filters.to'),
  },
  {
    type: 'date-range',
    keyFrom: 'birthdayFrom',
    keyTo: 'birthdayTo',
    label: t('fields.birthday'),
    placeholderFrom: t('filters.from'),
    placeholderTo: t('filters.to'),
  },
];
