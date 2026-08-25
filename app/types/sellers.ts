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

/** Баланс продавца по надбавкам (markup): earned - refunded - paidOut = balance. */
export interface SellerBalance {
  sellerId: string;
  earned: number;
  refunded: number;
  paidOut: number;
  balance: number;
}

export interface SellerCredit {
  id: string;
  sellerId: string;
  amount: number;
  note: string | null;
  createdAt: string;
  createdBy: { id: string; name: string } | null;
}

export interface CreateSellerCreditRequest {
  amount: number;
  note?: string;
}

export type SellerBalanceResponse = ApiResponse<SellerBalance>;
export type SellerCreditResponse = ApiResponse<SellerCredit>;
export type SellerCreditsResponse = ApiResponse<PaginatedData<SellerCredit>>;

export type SellersResponse = ApiResponse<PaginatedData<Seller>>;
export type SellerDetailResponse = ApiResponse<Seller>;
