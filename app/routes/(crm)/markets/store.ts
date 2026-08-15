import { createModalStore } from '~/store/createModalStore';
import { createTableStore } from '~/store/useTableStore';
import type { Market } from '~/types/markets';

export const useMarketsStore = createTableStore();

type MarketsModals = {
  delete: string;
  create: null;
  edit: Market;
};

export const useMarketsModals = createModalStore<MarketsModals>(['delete', 'create', 'edit']);
