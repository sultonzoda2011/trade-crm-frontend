import { createModalStore } from '~/store/createModalStore';
import { createTableStore } from '~/store/useTableStore';
import type { TransactionDetail, TransactionListItem } from '~/types/transactions';

export const useTransactionsStore = createTableStore();

type TransactionsModals = {
  delete: string;
  // Narrowest shape the modal actually needs — opened from both the list row
  // (TransactionListItem) and the detail page (full Transaction, a superset).
  pay: TransactionListItem;
  refund: TransactionDetail;
};

export const useTransactionsModals = createModalStore<TransactionsModals>(['delete', 'pay', 'refund']);
