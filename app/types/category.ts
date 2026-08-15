import type { ApiResponse, PaginatedData } from './common';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  marketId: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { products: number };
}
export interface CategoryDetail {
  id: string;
  name: string;
  description: string;
  image: string;
  marketId: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    products: number;
  };
}
export type CategoriesResponse = ApiResponse<PaginatedData<Category>>;
export type CategoryDetailResponse = ApiResponse<CategoryDetail>;
export interface CreateCategoryRequest {
  name: string;
  description?: string;
  image?: string;
}
export type UpdateCategoryRequest = Partial<CreateCategoryRequest>;
