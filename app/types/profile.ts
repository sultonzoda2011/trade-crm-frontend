import type { ApiResponse, Role } from '~/types/common';
import type { Market } from '~/types/markets';
import type { SellerBalance, SellerCredit } from '~/types/sellers';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  role: Role;
  marketId: string | null;
  createdAt: string;
  /** Когда пароль меняли в последний раз; `null` — ни разу. */
  passwordChangedAt: string | null;
}

export type ProfileResponse = ApiResponse<Profile>;

/** Заработок продавца: баланс по надбавкам, текущий месяц и последние выплаты. */
export interface ProfileEarnings {
  balance: Omit<SellerBalance, 'sellerId'>;
  month: { since: string; salesCount: number; earned: number };
  credits: SellerCredit[];
}

export interface ProfileFullData {
  profile: Profile;
  market: Market | null;
  /** Только у продавца. */
  earnings: ProfileEarnings | null;
}
export type ProfileFullResponse = ApiResponse<ProfileFullData>;

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type UpdatePasswordResponse = ApiResponse<{ passwordChangedAt: string }>;
