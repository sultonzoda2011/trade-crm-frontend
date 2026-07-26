import type { ApiResponse, PaginatedData } from './common';
import type { MarketInfo } from './markets';

export interface ProductCount {
  transactionItems: number;
}

export type ProductUnit = 'PCS' | 'KG' | 'L' | 'M' | 'BOX';

export interface CategoryInfo {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  unit: ProductUnit;
  lowStockThreshold: number;
  image: string | null;
  marketId: string;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
  market: MarketInfo;
  category: CategoryInfo | null;
  _count: ProductCount;
}
export interface ProductInfo {
  id: string;
  name: string;
  price: number;
  image: string;
}
export type ProductsResponse = ApiResponse<PaginatedData<Product>>;
export type ProductDetailResponse = ApiResponse<Product>;

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
