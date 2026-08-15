import type {
  BusinessInsight,
  MetricComparison,
  ProductHealth,
  ProductMetrics,
  ReorderPriority,
} from '~/types/analytics';
import type { ApiResponse } from '~/types/common';
import type { MarketInfo } from '~/types/markets';

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
  market: { id: string; name: string; image: string | null };
  createdBy: { id: string; name: string; image: string | null };
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
  revenueTrend: RevenueTrendData[];
  paymentDistribution: PaymentTypeDistribution[];
}

export type DashboardResponse = ApiResponse<DashboardData>;

export interface SellerReportRow {
  seller: { id: string; name: string; email: string; role: string; image: string | null } | null;
  salesCount: number;
  salesAmount: number;
  refundsCount: number;
  refundsAmount: number;
  debtsCount: number;
  debtsAmount: number;
}
export type SellersReportResponse = ApiResponse<SellerReportRow[]>;

/* ------------------------------------------------------------------ */
/* Business overview — GET /dashboard/overview                         */
/* ------------------------------------------------------------------ */

export interface OverviewPeriod {
  current: { gte: string; lte: string };
  previous: { gte: string; lte: string };
  durationDays: number;
}

export interface OverviewSales {
  /** Revenue from cash/card sales, net of refunds. */
  saleRevenue: number;
  /** Value handed out on credit in the period, net of refunds. */
  debtIssued: number;
  /** Everything that left the shelves in money terms: sales + debts. */
  netRevenue: number;
  /** Before refunds — needed to show what returns cost. */
  grossRevenue: number;
  refundedRevenue: number;
  unitsSold: number;
  refundedUnits: number;
  discountAmount: number;
  transactionCount: number;
  saleCount: number;
  debtCount: number;
  averageCheck: number;
  returnRate: number;
  comparison: {
    netRevenue: MetricComparison;
    transactionCount: MetricComparison;
    averageCheck: MetricComparison;
    unitsSold: MetricComparison;
  };
}

/** Debt figures are as of now, not for the period — see the backend note. */
export interface OverviewDebts {
  totalOutstanding: number;
  activeDebtCount: number;
  activeDebtorCount: number;
  overdueAmount: number;
  overdueCount: number;
  dueSoonAmount: number;
  dueSoonCount: number;
  /** Collected within the selected period — the one period-scoped figure here. */
  collectedAmount: number;
  collectedCount: number;
}

export interface ReturnedProductRow {
  productId: string;
  productName: string;
  refundedUnits: number;
  refundedAmount: number;
  unitsSold: number;
  returnRate: number;
}

export interface OverviewReturns {
  amount: number;
  units: number;
  returnRate: number;
  /** What the period would have earned without refunds. */
  revenueImpact: number;
  topProducts: ReturnedProductRow[];
  comparison: {
    amount: MetricComparison;
    returnRate: MetricComparison;
  };
}

export interface OverviewInventory {
  totalProducts: number;
  outOfStock: number;
  critical: number;
  lowStock: number;
  slowMoving: number;
  noSales: number;
  highReturns: number;
  healthy: number;
  needsReorder: number;
  /** Money sitting on the shelves. */
  stockValue: number;
  /** Of that, how much is frozen in stock that barely moves. */
  slowMovingValue: number;
}

export interface ProductLeaderRow {
  productId: string;
  productName: string;
  netUnits: number;
  netRevenue: number;
  refundedUnits: number;
}

/** A catalogue row enriched with metrics — what the reorder list is built from. */
export interface ReorderProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
  lowStockThreshold: number;
  unit: string;
  image: string | null;
  category: { id: string; name: string } | null;
  metrics: ProductMetrics;
}

export interface OverviewProducts {
  topByRevenue: ProductLeaderRow[];
  topByUnits: ProductLeaderRow[];
  reorder: ReorderProduct[];
}

export interface OverviewCategoryRow {
  categoryId: string | null;
  categoryName: string | null;
  netRevenue: number;
  netUnits: number;
  comparison: MetricComparison;
}

export interface OverviewData {
  period: OverviewPeriod;
  sales: OverviewSales;
  debts: OverviewDebts;
  returns: OverviewReturns;
  inventory: OverviewInventory;
  products: OverviewProducts;
  categories: OverviewCategoryRow[];
  revenueTrend: RevenueTrendData[];
  /** Same rows as the legacy distribution, but net of partial refunds. */
  paymentMix: PaymentTypeDistribution[];
  insights: BusinessInsight[];
}

export type OverviewResponse = ApiResponse<OverviewData>;

/** Re-exported so dashboard components need one import, not two. */
export type { ProductHealth, ReorderPriority };

