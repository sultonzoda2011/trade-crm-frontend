import type { TFunction } from 'i18next';
import { Role } from '~/types/common';
import type { ProductUnit } from '~/types/products';

/** Units a product can be sold in — backend enum members, never localised. */
export const UNIT_VALUES = ['PCS', 'KG', 'L', 'M', 'BOX'] satisfies ProductUnit[];

export const getUnitOptions = (t: TFunction) => UNIT_VALUES.map((u) => ({ value: u, label: t(`unit.${u}`) }));

export const ROLE_CONFIG: Record<string, { label: (t: TFunction) => string; className: string }> = {
  [Role.Admin]: {
    label: (t) => t('role.admin'),
    className:
      'bg-violet-500/15 text-violet-600 border-violet-200 dark:bg-violet-500/20 dark:text-violet-400 dark:border-violet-500/30',
  },
  [Role.Owner]: {
    label: (t) => t('role.owner'),
    className:
      'bg-amber-500/15 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
  },
  [Role.Seller]: {
    label: (t) => t('role.seller'),
    className: 'bg-sky-500/15 text-sky-600 border-sky-200 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/30',
  },
};

export const getRoleOptions = (t: TFunction) => [
  { value: Role.Admin, label: t('role.admin') },
  { value: Role.Owner, label: t('role.owner') },
  { value: Role.Seller, label: t('role.seller') },
];

export const getRoleFilterOptions = (t: TFunction) => [{ value: 'all', label: t('filters.all') }, ...getRoleOptions(t)];

export const getTransactionTypeOptions = (t: TFunction) => [
  { value: 'SALE', label: t('type.SALE') },
  { value: 'DEBT', label: t('type.DEBT') },
  { value: 'REFUND', label: t('type.REFUND') },
];

export const getPaymentTypeOptions = (t: TFunction) => [
  { value: 'CASH', label: t('paymentType.CASH') },
  { value: 'CARD', label: t('paymentType.CARD') },
  { value: 'CREDIT', label: t('paymentType.CREDIT') },
];
