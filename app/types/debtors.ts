import type { DebtorRisk } from '~/types/analytics';
import type { ApiResponse, PaginatedData } from '~/types/common';
import type { MarketInfo } from '~/types/markets';

/**
 * Aggregated debt position of one debtor, computed by the backend.
 *
 * `factors` are i18n keys (`overdueShare.majority`, `activity.stale`, …), not
 * sentences: the reason a debtor scored HIGH has to be readable in ru/en/tg
 * and has to stay in sync with the single scoring rule on the backend.
 */
export interface DebtorDebtProfile {
  totalDebtAmount: number;
  activeDebtCount: number;
  overdueAmount: number;
  overdueCount: number;
  totalIssued: number;
  totalCollected: number;
  /** Share of everything ever lent that came back, 0..1. */
  repaymentRate: number;
  maxDaysOverdue: number;
  daysSinceLastPayment: number | null;
  lastPaymentAt: string | null;
  nextDueDate: string | null;
  risk: DebtorRisk;
  score: number;
  factors: string[];
}

export interface Debtor extends DebtorDebtProfile {
  id: string;
  name: string;
  phone: string;
  marketId: string;
  createdAt: string;
  updatedAt: string;
  market: MarketInfo | null;
  _count: DebtorCount;
}
export interface DebtorInfo {
  id: string;
  name: string;
  phone: string;
}
export interface DebtorCount {
  transactions: number;
}
export interface DebtorRequest {
  name: string;
  phone: string;
}
export type DebtorsResponse = ApiResponse<PaginatedData<Debtor>>;
export type DebtorDetailResponse = ApiResponse<Debtor>;
