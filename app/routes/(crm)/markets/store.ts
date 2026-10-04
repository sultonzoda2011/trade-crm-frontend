import { createModalStore } from '~/store/createModalStore';
import { createTableStore } from '~/store/useTableStore';

export const useMarketsStore = createTableStore();

type MarketsModals = {
  delete: string;
};

export const useMarketsModals = createModalStore<MarketsModals>(['delete']);
