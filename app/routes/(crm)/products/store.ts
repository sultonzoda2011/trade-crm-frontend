import { createModalStore } from '~/store/createModalStore';
import { createTableStore } from '~/store/useTableStore';
import type { StockTarget } from '~/types/products';

export const useProductsStore = createTableStore();

type ProductsModals = {
  delete: string;
  /** В архив — подтверждение; данные — id товара. */
  archive: string;
  restock: StockTarget;
  writeOff: StockTarget;
  adjust: StockTarget;
  /** Массовая цена не привязана к товару — окну данные не нужны. */
  bulkPrice: true;
};

export const useProductsModals = createModalStore<ProductsModals>([
  'delete',
  'archive',
  'restock',
  'writeOff',
  'adjust',
  'bulkPrice',
]);
