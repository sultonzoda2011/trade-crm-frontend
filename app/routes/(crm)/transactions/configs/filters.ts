import type { TFunction } from 'i18next';
import type { FilterConfig } from '~/types/filters';
import { getPaymentTypeOptions, getTransactionTypeOptions } from '~/config/enumOptions';

export const getTransactionFilters = (
  t: TFunction,
  debtorOptions?: { value: unknown; label: string }[],
  categoryOptions?: { value: unknown; label: string }[],
  productOptions?: { value: unknown; label: string }[],
  sellerOptions?: { value: unknown; label: string }[]
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

  if (sellerOptions && sellerOptions.length > 0) {
    config.push({
      type: 'select',
      key: 'createdById',
      label: t('fields.createdBy'),
      placeholder: t('filters.all', { ns: 'common' }),
      options: sellerOptions,
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
      // Значения — в точности backend TransactionStatus (Prisma enum).
      // PARTIALLY_REFUNDED раньше отсутствовал в руками продублированном
      // src/enums/transaction-status.enum.ts на бэкенде — ?status= давал 400
      // (class-validator IsEnum), выбор молча ломался. Дубль синхронизирован,
      // фильтр теперь включает все статусы.
      options: [
        { value: 'ACTIVE', label: t('status.ACTIVE') },
        { value: 'PARTIAL', label: t('status.PARTIAL') },
        { value: 'PAID', label: t('status.PAID') },
        { value: 'REFUNDED', label: t('status.REFUNDED') },
        { value: 'PARTIALLY_REFUNDED', label: t('status.PARTIALLY_REFUNDED') },
      ],
    },
    // Состояние долга, вычисляемое backend'ом на момент запроса (не колонка в
    // БД). Ссылки с дашборда (OverdueAlertCard) ведут на
    // `/transactions?debtStatus=OVERDUE`/`DUE_SOON` — без этого фильтра в
    // конфиге `useFilterParams` не читает такой URL-параметр вообще, и переход
    // с дашборда ничего не фильтрует.
    {
      type: 'select',
      key: 'debtStatus',
      label: t('debtStatus.title'),
      placeholder: t('filters.all', { ns: 'common' }),
      options: [
        { value: 'OVERDUE', label: t('debtStatus.OVERDUE') },
        { value: 'DUE_SOON', label: t('debtStatus.DUE_SOON') },
        { value: 'OUTSTANDING', label: t('debtStatus.OUTSTANDING') },
        { value: 'SETTLED', label: t('debtStatus.SETTLED') },
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
    }
  );

  return config;
};
