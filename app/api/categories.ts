import { detailRequest, listRequest, multipartWrites, nestedDetailRequest } from '~/api/crud';
import { apiClient } from '~/lib/client';
import type {
  CategoriesResponse,
  CategoriesSummaryResponse,
  CategoryDetailResponse,
  CategoryFullResponse,
  DeleteCategoryChoice,
  DeleteCategoryResult,
} from '~/types/products';
import type { ApiResponse } from '~/types/common';

const BASE = '/categories';

export const categoriesApi = {
  getAll: listRequest<CategoriesResponse>(BASE),
  getById: detailRequest<CategoryDetailResponse>(BASE),
  getFull: nestedDetailRequest<CategoryFullResponse>(BASE),
  getSummary: async (config?: import('axios').AxiosRequestConfig): Promise<CategoriesSummaryResponse> =>
    (await apiClient.get(`${BASE}/summary`, config)).data,
  /** Порядок категорий: id в нужной очерёдности (только ADMIN/OWNER). */
  reorder: async (ids: string[]): Promise<unknown> => (await apiClient.put(`${BASE}/order`, { ids })).data,
  /**
   * Удаление. У категории с товарами нужно выбрать: перенести (`moveTo`) или оставить без категории
   * (`detach`) — иначе 409 `CATEGORY_HAS_PRODUCTS`. Без аргумента — как раньше, для пустой категории.
   */
  delete: async (id: string, choice?: DeleteCategoryChoice): Promise<ApiResponse<DeleteCategoryResult>> =>
    (
      await apiClient.delete(`${BASE}/${id}`, {
        params: choice ? ('moveTo' in choice ? { moveTo: choice.moveTo } : { detach: true }) : undefined,
      })
    ).data,
  ...multipartWrites(BASE),
};
