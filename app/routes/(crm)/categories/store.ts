import { createModalStore } from '~/store/createModalStore';
import { createTableStore } from '~/store/useTableStore';
import type { CategoryDetail } from '~/types/products';

export const useCategoriesStore = createTableStore();

type CategoriesModals = {
  delete: string;
  create: null;
  edit: CategoryDetail;
};

export const useCategoriesModals = createModalStore<CategoriesModals>(['delete', 'create', 'edit']);
