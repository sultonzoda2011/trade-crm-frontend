import type { ApiResponse, PaginatedData } from './common';

export interface ProductMarket {
  id: string;
  name: string;
  address: string;
  image: string;
}

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
  market: ProductMarket;
  _count: ProductCount;
}
export type ProductsResponse = ApiResponse<PaginatedData<Product>>;
export type ProductDetailResponse = ApiResponse<Product>;
