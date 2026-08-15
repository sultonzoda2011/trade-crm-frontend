import type { ApiResponse, PaginatedData } from '~/types/common';
import type { MarketInfo } from '~/types/markets';

export interface Seller {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: string;
  market: MarketInfo | null;
}
export interface SellerRequest {
  name: string;
  email: string;
  password: string;
  image?: string | File | null;
}

export type SellersResponse = ApiResponse<PaginatedData<Seller>>;
export type SellerDetailResponse = ApiResponse<Seller>;
