import { deleteRequest, detailRequest, listRequest, multipartWrites } from '~/api/crud';
import type { ProductDetailResponse, ProductsResponse } from '~/types/products';

const BASE = '/products';

export const productsApi = {
  getAll: listRequest<ProductsResponse>(BASE),
  getById: detailRequest<ProductDetailResponse>(BASE),
  delete: deleteRequest(BASE),
  ...multipartWrites(BASE),
};
