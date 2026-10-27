import type { DebtorRisk } from '~/types/analytics';
import type { ApiResponse, PaginatedData } from '~/types/common';
import type { MarketInfo } from '~/types/markets';
import type { Transaction } from '~/types/transactions';

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
  /** Заполнено только когда активный долг ровно один — тогда можно погасить в один тап из списка. */
  activeDebtTransactionId: string | null;
  lastPurchase: DebtorLastPurchase | null;
}

export interface DebtorLastPurchase {
  at: string;
  items: Array<{ productId: string; name: string; quantity: number; image: string | null }>;
}

export interface Debtor extends DebtorDebtProfile {
  id: string;
  name: string;
  phone: string;
  marketId: string;
  createdAt: string;
  updatedAt: string;
  /** Заметка продавца: «ряд 5, лавка 12». */
  note: string | null;
  /** Мягкий лимит долга: превышение только предупреждает. 0/null — лимита нет. */
  creditLimit: number | null;
  /** Срок возврата по умолчанию для нового долга, дни. */
  defaultDueDays: number | null;
  /** Когда последний раз напомнили о долге (звонок/WhatsApp/SMS). */
  lastRemindedAt: string | null;
  /** Приходит при создании/правке: другой должник с тем же телефоном (только предупреждение). */
  phoneDuplicateOf?: { id: string; name: string } | null;
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
  note?: string;
  creditLimit?: number;
  defaultDueDays?: number;
}

/** Событие ленты должника: выдача долга или оплата, с остатком после него. */
export interface DebtorLedgerEvent {
  type: 'DEBT' | 'PAYMENT';
  id: string;
  transactionId: string;
  /** Всегда положительное; знак задаёт `type`. */
  amount: number;
  /** Сколько человек должен сразу после этого события. */
  balanceAfter: number;
  at: string;
  dueDate: string | null;
  note: string | null;
  itemNames: string[];
  createdByName: string | null;
}

export interface DebtorCallItem {
  id: string;
  name: string;
  phone: string;
  overdueAmount: number;
  maxDaysOverdue: number;
  risk: DebtorRisk;
}

/** Сводка над списком должников — по всем должникам маркета, не по странице. */
export interface DebtorsSummary {
  totalDebt: number;
  overdueAmount: number;
  debtorsWithDebt: number;
  overdueDebtors: number;
  highRiskDebtors: number;
  /** С кем разбираться сегодня: просрочка, ещё не напоминали. */
  callToday: DebtorCallItem[];
}

export interface DebtorPaymentAllocation {
  transactionId: string;
  amount: number;
  remainingAfter: number;
  settled: boolean;
}

export interface DebtorPaymentResult {
  totalApplied: number;
  /** Сколько человек должен после платежа. */
  remainingDebt: number;
  allocations: DebtorPaymentAllocation[];
}

export interface DebtorPaymentRequest {
  amount: number;
  note?: string;
}
export type DebtorsResponse = ApiResponse<PaginatedData<Debtor>>;
export type DebtorDetailResponse = ApiResponse<Debtor>;
export interface DebtorFullData {
  debtor: Debtor;
  transactions: PaginatedData<Transaction>;
}
export type DebtorFullResponse = ApiResponse<DebtorFullData>;
export type DebtorLedgerResponse = ApiResponse<PaginatedData<DebtorLedgerEvent>>;
export type DebtorsSummaryResponse = ApiResponse<DebtorsSummary>;
export type DebtorPaymentResponse = ApiResponse<DebtorPaymentResult>;
