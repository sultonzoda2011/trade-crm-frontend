import { createModalStore } from '~/store/createModalStore';
import { createTableStore } from '~/store/useTableStore';
import type { Market } from '~/types/markets';

export const useMyMarketStore = createTableStore();

type MyMarketModals = {
  edit: Market;
};

export const useMyMarketModals = createModalStore<MyMarketModals>(['edit']);
