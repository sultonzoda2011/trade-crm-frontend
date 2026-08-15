import { createModalStore } from '~/store/createModalStore';
import { createTableStore } from '~/store/useTableStore';
import type { Transaction, TransactionDetail } from '~/types/transactions';

export const useTransactionsStore = createTableStore();

type TransactionsModals = {
  delete: string;
  pay: Transaction;
  refund: TransactionDetail;
};

export const useTransactionsModals = createModalStore<TransactionsModals>(['delete', 'pay', 'refund']);
