import type { TFunction } from 'i18next';
import type { FilterConfig } from '~/types/filters';

export const getTransactionFilters = (t: TFunction): FilterConfig[] => [
  {
    type: 'select',
    key: 'type',
    label: t('fields.type'),
    placeholder: t('filters.all', { ns: 'common' }),
    options: [
      { value: 'SALE', label: t('type.SALE') },
      { value: 'DEBT', label: t('type.DEBT') },
    ],
  },
  {
    type: 'select',
    key: 'status',
    label: t('fields.status'),
    placeholder: t('filters.all', { ns: 'common' }),
    options: [
      { value: 'ACTIVE', label: t('status.ACTIVE') },
      { value: 'PARTIAL', label: t('status.PARTIAL') },
      { value: 'PAID', label: t('status.PAID') },
    ],
  },
  {
    type: 'select',
    key: 'paymentType',
    label: t('fields.paymentType'),
    placeholder: t('filters.all', { ns: 'common' }),
    options: [
      { value: 'CASH', label: t('paymentType.CASH') },
      { value: 'CARD', label: t('paymentType.CARD') },
      { value: 'CREDIT', label: t('paymentType.CREDIT') },
    ],
  },
];
