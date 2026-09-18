import type { ApiResponse, PaginatedData } from '~/types/common';
import type { Market, MarketInfo } from '~/types/markets';
import type { Transaction } from '~/types/transactions';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  market: MarketInfo | null;
}

export interface UserRequest {
  name: string;
  email: string;
  password: string;
}
export interface UserInfo {
  id: string;
  image: string | null;
  name: string;
  email: string;
}
export interface CreateUserRequest extends UserRequest {
  role: string;
}
export type UsersResponse = ApiResponse<PaginatedData<User>>;
export type UserDetailResponse = ApiResponse<User>;
export interface UserFullData {
  user: User;
  /** null для SELLER — маркеты в владении запрашиваются только для ADMIN/OWNER. */
  markets: PaginatedData<Market> | null;
  transactions: PaginatedData<Transaction>;
}
export type UserFullResponse = ApiResponse<UserFullData>;
