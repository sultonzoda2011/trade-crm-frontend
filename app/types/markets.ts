import type { ApiResponse, PaginatedData } from '~/types/common';
import type { Product } from '~/types/products';
import type { Debtor } from '~/types/debtors';
import type { Transaction } from '~/types/transactions';
import type { User } from '~/types/users';

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
export interface MarketInfo {
  id: string;
  name: string;
  address: string;
  image: string;
}

export interface MarketCount {
  products: number;
  debtors: number;
  transactions: number;
}

export type MarketDetailResponse = ApiResponse<Market>;
export type MarketsResponse = ApiResponse<PaginatedData<Market>>;
export interface MarketFullData {
  market: Market;
  products: PaginatedData<Product> | null;
  debtors: PaginatedData<Debtor> | null;
  transactions: PaginatedData<Transaction> | null;
}
export type MarketFullResponse = ApiResponse<MarketFullData>;
