import type { ApiResponse } from './common';
import type { MarketInfo } from './markets';

export interface DashboardStats {
  totalMarkets: number;
  totalUsers: number;
  totalDebtors: number;
  totalTransactions: number;
  activeDebts: number;
  partialDebts: number;
  totalDebtAmount: number;
  totalSaleAmount: number;
  todayTransactions: number;
}

export interface DashboardRecentTransaction {
  id: string;
  type: 'DEBT' | 'SALE' | 'REFUND';
  status: 'ACTIVE' | 'PARTIAL' | 'PAID' | 'REFUNDED';
  totalAmount: number;
  remainingAmount: number;
  createdAt: string;
  debtor: { id: string; name: string } | null;
  market: { id: string; name: string };
  createdBy: { id: string; name: string };
}

export interface DashboardTopDebtor {
  id: string;
  name: string;
  phone: string;
  market?: MarketInfo;
  totalDebt: number;
  activeTransactions: number;
}

export interface RevenueTrendData {
  date: string; // YYYY-MM-DD format
  revenue: number;
  transactionCount: number;
}

export interface PaymentTypeDistribution {
  type: 'CASH' | 'CARD' | 'CREDIT';
  count: number;
  amount: number;
  percentage: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentTransactions: DashboardRecentTransaction[];
  topDebtors: DashboardTopDebtor[];
  revenueTrend?: RevenueTrendData[];
  paymentDistribution?: PaymentTypeDistribution[];
}

export type DashboardResponse = ApiResponse<DashboardData>;

export interface SellerReportRow {
  seller: { id: string; name: string; email: string; role: string } | null;
  salesCount: number;
  salesAmount: number;
  refundsCount: number;
  refundsAmount: number;
  debtsCount: number;
  debtsAmount: number;
}
export type SellersReportResponse = ApiResponse<SellerReportRow[]>;
