import type { ApiResponse, PaginatedData } from './common';
import type { MarketInfo } from './markets';

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
export interface UserInfo {
  id: string;
  name: string;
  email: string;
}
export interface CreateUserRequest extends UserRequest {
  role: string;
}
export type UsersResponse = ApiResponse<PaginatedData<User>>;
export type UserDetailResponse = ApiResponse<User>;
