import type { ApiResponse, PaginatedData } from './common';

export interface MarketInfo {
  id: string;
  name: string;
  address: string;
  image: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  market: MarketInfo | null;
}
export interface UserRequest {
  name: string;
  email: string;
  password: string;
}
export interface CreateUserRequest extends UserRequest {
  role: string;
}
export type UsersResponse = ApiResponse<PaginatedData<User>>;
export type UserDetailResponse = ApiResponse<User>;
