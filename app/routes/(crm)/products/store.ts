import { createModalStore } from '~/store/createModalStore';
import { createTableStore } from '~/store/useTableStore';
import type { RestockTarget } from '~/types/products';

export const useProductsStore = createTableStore();

type ProductsModals = {
  delete: string;
  restock: RestockTarget;
};

export const useProductsModals = createModalStore<ProductsModals>(['delete', 'restock']);
