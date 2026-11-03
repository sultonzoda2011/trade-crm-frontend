import type { ApiResponse, PaginatedData } from '~/types/common';
import type { MarketInfo } from '~/types/markets';
import type { Transaction } from '~/types/transactions';

/** Что показываем в списке за выбранный период и сколько продавцу должны сейчас. */
export interface SellerStats {
  salesCount: number;
  /** Продано за период: чеки (деньги + долг) минус возвраты по его продажам. */
  sold: number;
  /** Надбавка за период минус надбавка возвращённых строк. */
  earned: number;
  /** Сколько ему должны сейчас (за всё время). Меньше нуля — переплата. */
  balance: number;
  /** Часть баланса, которая сидит в ещё не погашенных долгах. */
  pendingInDebts: number;
  lastSaleAt: string | null;
}

export interface Seller {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  /** `false` — отключён: войти не может, история осталась. */
  isActive: boolean;
  deactivatedAt: string | null;
  passwordChangedAt: string | null;
  createdAt: string;
  market: MarketInfo | null;
  /** Есть только в списке со статистикой (`withStats`). */
  stats?: SellerStats;
}

/** Баланс продавца по надбавкам: earned - refunded - paidOut = balance. */
export interface SellerBalance {
  sellerId: string;
  earned: number;
  refunded: number;
  /** Выдано на руки, отменённые выплаты уже вычтены. */
  paidOut: number;
  balance: number;
  pendingInDebts: number;
}

export interface SellerCredit {
  id: string;
  sellerId: string;
  /** Отрицательная сумма — запись об отмене выплаты. */
  amount: number;
  note: string | null;
  createdAt: string;
  createdBy: { id: string; name: string } | null;
  reversalOfId?: string | null;
  isReversed?: boolean;
}

export interface CreateSellerCreditRequest {
  amount: number;
  note?: string;
}

export type SellerPeriod = 'today' | 'week' | 'month' | 'year';
export type SellerStatus = 'active' | 'disabled' | 'all';

/** Шапка экрана «Продавцы». */
export interface SellersSummary {
  period: { from: string; to: string };
  counts: { active: number; disabled: number };
  salesCount: number;
  sold: number;
  earned: number;
  /** Сколько всего должны продавцам (только положительные балансы). */
  toPay: number;
  toPayCount: number;
  overpaid: number;
  pendingInDebts: number;
}

export type EarningsEntryKind = 'EARNED' | 'REFUNDED' | 'PAYOUT' | 'PAYOUT_REVERSAL';

/** Строка ленты «из чего сложился баланс». `amount` — влияние на баланс со знаком. */
export interface EarningsEntry {
  id: string;
  kind: EarningsEntryKind;
  at: string;
  amount: number;
  transactionId: string | null;
  relatedTransactionId: string | null;
  transactionType: 'SALE' | 'DEBT' | 'REFUND' | null;
  transactionStatus: string | null;
  counterparty: string | null;
  note: string | null;
  byName: string | null;
  reversalOfId: string | null;
  reversedById: string | null;
}

export interface SellerEarnings {
  balance: SellerBalance;
  entries: PaginatedData<EarningsEntry>;
}

export interface SellerDetail extends Seller {
  /** Есть чеки, платежи или выплаты — удалить нельзя, только отключить. */
  hasHistory?: boolean;
}

export type SellerBalanceResponse = ApiResponse<SellerBalance>;
export type SellerCreditResponse = ApiResponse<SellerCredit>;
export type SellerCreditsResponse = ApiResponse<PaginatedData<SellerCredit>>;
export type SellersSummaryResponse = ApiResponse<SellersSummary>;
export type SellerEarningsResponse = ApiResponse<SellerEarnings>;
export type ResetPasswordResponse = ApiResponse<{ password: string; passwordChangedAt: string }>;

export type SellersResponse = ApiResponse<PaginatedData<Seller>>;
export type SellerDetailResponse = ApiResponse<Seller>;
export interface SellerFullData {
  seller: SellerDetail;
  transactions: PaginatedData<Transaction>;
  balance: SellerBalance;
  credits: PaginatedData<SellerCredit>;
  /** Первая страница ленты заработка + тот же баланс. */
  feed: SellerEarnings;
  /** Текущий месяц (UTC, как и вся аналитика). */
  month: { since: string; salesCount: number; sold: number; earned: number };
}
export type SellerFullResponse = ApiResponse<SellerFullData>;
