import type { ApiResponse } from './common';
import type { User } from './users';

export interface Login {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export type RefreshResponse = Login;

export type LoginResponse = ApiResponse<Login>;
