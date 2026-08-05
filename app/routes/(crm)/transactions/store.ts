import { createModalStore } from '~/store/createModalStore';
import { createTableStore } from '~/store/useTableStore';
import type { Transaction } from '~/types/transactions';

export const useTransactionsStore = createTableStore();

type TransactionsModals = {
  delete: string;
  pay: Transaction;
};

export const useTransactionsModals = createModalStore<TransactionsModals>(['delete', 'pay']);
