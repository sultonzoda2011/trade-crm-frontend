import { createModalStore } from '~/store/createModalStore';
import { createTableStore } from '~/store/useTableStore';

export const useCategoriesStore = createTableStore();

/** Что нужно окну удаления: у категории с товарами оно предлагает «перенести» или «оставить без категории». */
export interface DeleteCategoryTarget {
  id: string;
  name: string;
  /** Все товары категории, архивные тоже: их это удаление тоже касается. */
  productsCount: number;
  /** Куда уйти после удаления (со страницы категории — в список). */
  redirectTo?: string;
}

type CategoriesModals = {
  /** Стандартное подтверждение списка (`useEntityList`) — здесь не открывается: удаление идёт через `remove`. */
  delete: string;
  remove: DeleteCategoryTarget;
};

export const useCategoriesModals = createModalStore<CategoriesModals>(['delete', 'remove']);
