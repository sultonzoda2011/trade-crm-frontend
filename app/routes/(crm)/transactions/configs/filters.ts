import type { TFunction } from 'i18next';
import type { FilterConfig } from '~/types/filters';
import { getPaymentTypeOptions, getTransactionTypeOptions } from '~/config/enumOptions';

export const getTransactionFilters = (
  t: TFunction,
  debtorOptions?: { value: unknown; label: string }[],
  categoryOptions?: { value: unknown; label: string }[],
  productOptions?: { value: unknown; label: string }[],
): FilterConfig[] => {
  const config: FilterConfig[] = [];

  if (debtorOptions && debtorOptions.length > 0) {
    config.push({
      type: 'select',
      key: 'debtorId',
      label: t('filters.debtor'),
      placeholder: t('filters.all', { ns: 'common' }),
      options: debtorOptions,
    });
  }

  if (categoryOptions && categoryOptions.length > 0) {
    config.push({
      type: 'select',
      key: 'categoryId',
      label: t('filters.category'),
      placeholder: t('filters.all', { ns: 'common' }),
      options: categoryOptions,
    });
  }

  if (productOptions && productOptions.length > 0) {
    config.push({
      type: 'select',
      key: 'productId',
      label: t('filters.product'),
      placeholder: t('filters.all', { ns: 'common' }),
      options: productOptions,
    });
  }

  config.push(
    {
      type: 'select',
      key: 'type',
      label: t('fields.type'),
      placeholder: t('filters.all', { ns: 'common' }),
      options: getTransactionTypeOptions(t),
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
      options: getPaymentTypeOptions(t),
    },
    {
      type: 'number-range',
      keyFrom: 'minAmount',
      keyTo: 'maxAmount',
      label: t('fields.amount'),
      placeholderFrom: t('filters.min', { ns: 'common' }),
      placeholderTo: t('filters.max', { ns: 'common' }),
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
        { value: 'amount', label: t('filters.amount') },
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
