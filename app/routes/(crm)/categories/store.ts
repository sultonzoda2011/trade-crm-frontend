import { createModalStore } from '~/store/createModalStore';
import { createTableStore } from '~/store/useTableStore';

export const useCategoriesStore = createTableStore();

type CategoriesModals = {
  delete: string;
};

export const useCategoriesModals = createModalStore<CategoriesModals>(['delete']);
