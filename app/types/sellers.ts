import type { ApiResponse, PaginatedData } from './common';
import type { MarketInfo } from './markets';

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
