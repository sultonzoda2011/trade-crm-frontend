import { createModalStore } from '~/store/createModalStore';
import { createTableStore } from '~/store/useTableStore';
import type { Debtor } from '~/types/debtors';

export const useDebtorsStore = createTableStore();

type DebtorsModals = {
  delete: string;
  create: null;
  edit: Debtor;
};

export const useDebtorsModals = createModalStore<DebtorsModals>(['delete', 'create', 'edit']);
