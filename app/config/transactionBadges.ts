import type { TransactionStatus, TransactionType } from '~/types/transactions';

export const TRANSACTION_TYPE_BADGE: Record<TransactionType, string> = {
  SALE: 'border-success/40 bg-success/15 text-success font-medium',
  DEBT: 'border-warning/40 bg-warning/15 text-warning font-medium',
  REFUND: 'border-destructive/40 bg-destructive/15 text-destructive font-medium',
};

export const TRANSACTION_STATUS_BADGE: Record<TransactionStatus, string> = {
  PAID: 'border-success/40 bg-success/15 text-success',
  REFUNDED: 'border-destructive/40 bg-destructive/15 text-destructive',
  // Часть товара вернулась, продажа осталась действующей — это не полный
  // возврат, поэтому и цвет мягче destructive.
  PARTIALLY_REFUNDED: 'border-warning/40 bg-warning/15 text-warning',
  PARTIAL: 'border-sky-500/30 bg-sky-500/15 text-sky-500',
  ACTIVE: 'border-warning/40 bg-warning/15 text-warning',
};
