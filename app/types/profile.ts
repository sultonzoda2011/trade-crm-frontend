import type { ApiResponse } from '~/types/common';
import type { Role } from '~/types/common';

export interface Profile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: Role;
  marketId: string | null;
  createdAt: string;
}

export type ProfileResponse = ApiResponse<Profile>;

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
