import type { ApiResponse, PaginatedData } from './common';
import type { MarketInfo } from './markets';

export interface ProductCount {
  transactionItems: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image: string | null;
  marketId: string;
  createdAt: string;
  updatedAt: string;
  market: MarketInfo;
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
