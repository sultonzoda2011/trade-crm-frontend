import { createModalStore } from '~/store/createModalStore';
import { createTableStore } from '~/store/useTableStore';

export const useProductsStore = createTableStore();

type ProductsModals = {
  delete: string;
};

export const useProductsModals = createModalStore<ProductsModals>(['delete']);
