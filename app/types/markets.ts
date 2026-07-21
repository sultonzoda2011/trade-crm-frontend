import type { ApiResponse, PaginatedData } from './common';
import type { User } from './users';

export interface Market {
  id: string;
  name: string;
  address: string;
  image: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  users: User[];
  count: MarketCount;
  owner: User;
}

export interface MarketCount {
  products: number;
  debtors: number;
  transactions: number;
}

export type MarketDetailResponse = ApiResponse<Market>;
export type MarketsResponse = ApiResponse<PaginatedData<Market>>;
