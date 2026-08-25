import { createModalStore } from '~/store/createModalStore';
import { createTableStore } from '~/store/useTableStore';
import type { Seller } from '~/types/sellers';

export const useSellersStore = createTableStore();

type SellersModals = {
  delete: string;
  create: null;
  edit: Seller;
  payout: Seller;
};

export const useSellersModals = createModalStore<SellersModals>(['delete', 'create', 'edit', 'payout']);
