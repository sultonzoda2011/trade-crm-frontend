import type { ApiResponse, Role } from '~/types/common';
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  marketId: string;
  /** Login does not return the photo today; the shell loads it from `/profile` (see `useCurrentUser`). */
  image?: string | null;
}
export interface Login {
  accessToken: string;
  user: User;
}


export type LoginResponse = ApiResponse<Login>;
