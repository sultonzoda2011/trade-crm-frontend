import { createModalStore } from '~/store/createModalStore';
import { createTableStore } from '~/store/useTableStore';
import type { Product } from '~/types/products';

export const useProductsStore = createTableStore();

type ProductsModals = {
  delete: string;
  create: null;
  edit: Product;
};

export const useProductsModals = createModalStore<ProductsModals>(['delete', 'create', 'edit']);
