import type { ApiResponse, PaginatedData } from './common';
import type { MarketInfo } from './markets';

export interface Debtor {
  id: string;
  name: string;
  phone: string;
  marketId: string;
  createdAt: string;
  updatedAt: string;
  market: MarketInfo | null;
  _count: DebtorCount;
}
export interface DebtorInfo {
  id: string;
  name: string;
  phone: string;
}
export interface DebtorCount {
  transactions: number;
}
export interface DebtorRequest {
  name: string;
  phone: string;
}
export type DebtorsResponse = ApiResponse<PaginatedData<Debtor>>;
export type DebtorDetailResponse = ApiResponse<Debtor>;
