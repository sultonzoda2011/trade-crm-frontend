import { createModalStore } from '~/store/createModalStore';
import { createTableStore } from '~/store/useTableStore';
import type { Seller, SellerCredit } from '~/types/sellers';

export const useSellersStore = createTableStore();

type SellersModals = {
  delete: string;
  payout: Seller;
  /** Отмена выплаты: у какого продавца и какая именно. */
  reverse: { seller: Pick<Seller, 'id' | 'name'>; credit: Pick<SellerCredit, 'id' | 'amount'> };
  reset: Pick<Seller, 'id' | 'name'>;
  deactivate: Pick<Seller, 'id' | 'name'>;
};

export const useSellersModals = createModalStore<SellersModals>(['delete', 'payout', 'reverse', 'reset', 'deactivate']);
