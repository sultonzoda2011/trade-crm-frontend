import { createModalStore } from '~/store/createModalStore';
import { createTableStore } from '~/store/useTableStore';

export const useDebtorsStore = createTableStore();

type DebtorsModals = {
  delete: string;
  create: null;
};

export const useDebtorsModals = createModalStore<DebtorsModals>(['delete', 'create']);
