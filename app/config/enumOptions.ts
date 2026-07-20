import type { TFunction } from 'i18next';
import { Role } from '~/types/auth';
import { Status } from '~/types/common';

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

export const getRoleOptions = (t: TFunction) => [
  { value: 'all', label: t('filters.all') },
  { value: Role.Admin, label: t('role.admin') },
  { value: Role.Owner, label: t('role.owner') },
  { value: Role.Seller, label: t('role.seller') },
];
