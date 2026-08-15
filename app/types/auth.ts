import type { ApiResponse, Role } from '~/types/common';
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  marketId: string;
}
export interface Login {
  accessToken: string;
  user: User;
}


export type LoginResponse = ApiResponse<Login>;
