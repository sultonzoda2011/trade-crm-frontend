import { deleteRequest, detailRequest, listRequest, multipartWrites, nestedDetailRequest } from '~/api/crud';
import type { CategoriesResponse, CategoryDetailResponse, CategoryFullResponse } from '~/types/products';

const BASE = '/categories';

export const categoriesApi = {
  getAll: listRequest<CategoriesResponse>(BASE),
  getById: detailRequest<CategoryDetailResponse>(BASE),
  getFull: nestedDetailRequest<CategoryFullResponse>(BASE),
  delete: deleteRequest(BASE),
  ...multipartWrites(BASE),
};
