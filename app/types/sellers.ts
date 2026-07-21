import type { ApiResponse, PaginatedData } from './common';

export interface MarketInfo {
  id: string;
  name: string;
  address: string;
  image: string;
}

export interface Seller {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  market: MarketInfo | null;
}
export interface SellerRequest {
  name: string;
  email: string;
  password: string;
}

export type SellersResponse = ApiResponse<PaginatedData<Seller>>;
export type SellerDetailResponse = ApiResponse<Seller>;
