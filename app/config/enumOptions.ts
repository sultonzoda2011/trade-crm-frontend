import type { TFunction } from 'i18next';
import { Role, Status } from '~/types/common';

export const STATUS_CONFIG: Record<Status, { label: (t: TFunction) => string; className: string }> = {
  [Status.Inactive]: {
    label: (t) => t('status.inactive'),
    className: 'bg-rose-500 text-white border-transparent dark:bg-rose-600',
  },
  [Status.Active]: {
    label: (t) => t('status.active'),
    className: 'bg-emerald-500 text-white border-transparent dark:bg-emerald-600',
  },
  [Status.Completed]: {
    label: (t) => t('status.completed'),
    className: 'bg-blue-500 text-white border-transparent dark:bg-blue-600',
  },
};
export const getStatusOptions = (t: TFunction) => [
  { value: Status.Active, label: t('status.active') },
  { value: Status.Inactive, label: t('status.inactive') },
  { value: Status.Completed, label: t('status.completed') },
];
export const getDayLabels = (t: TFunction) => [
  t('days.monday'),
  t('days.tuesday'),
  t('days.wednesday'),
  t('days.thursday'),
  t('days.friday'),
  t('days.saturday'),
  t('days.sunday'),
];

export const getDayOptions = (t: TFunction) => [
  { value: 1, label: t('days.monday') },
  { value: 2, label: t('days.tuesday') },
  { value: 3, label: t('days.wednesday') },
  { value: 4, label: t('days.thursday') },
  { value: 5, label: t('days.friday') },
  { value: 6, label: t('days.saturday') },
  { value: 7, label: t('days.sunday') },
];

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
  
];

export const getPaymentTypeOptions = (t: TFunction) => [
  { value: 'CASH', label: t('paymentType.CASH') },
  { value: 'CARD', label: t('paymentType.CARD') },
  { value: 'CREDIT', label: t('paymentType.CREDIT') },
];
