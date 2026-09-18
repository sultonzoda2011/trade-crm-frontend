import type { ApiResponse, PaginatedData } from '~/types/common';
import type { Role } from '~/types/common';
import type { Market } from '~/types/markets';
import type { Transaction } from '~/types/transactions';

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

export interface ProfileFullData {
  profile: Profile;
  market: Market | null;
  transactions: PaginatedData<Transaction>;
}
export type ProfileFullResponse = ApiResponse<ProfileFullData>;

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
