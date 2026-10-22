import type {
  BusinessInsight,
  MetricComparison,
  ProductHealth,
  ProductMetrics,
  ReorderPriority,
} from '~/types/analytics';
import type { ApiResponse, Role } from '~/types/common';

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

export interface SellerReportRow {
  /**
   * `null` — the account was deleted after it made sales; the figures still count.
   * `role` is optional: copies of the report saved on a phone before the backend
   * sent it have no such field (the seller is then treated as a plain SELLER).
   */
  seller: { id: string; name: string; email: string; image: string | null; role?: Role } | null;
  /** Cash and card sales, net of the returns of sales this seller made. */
  salesCount: number;
  salesAmount: number;
  refundsCount: number;
  refundsAmount: number;
  /** Goods handed out on credit. */
  debtsCount: number;
  debtsAmount: number;
  /** Against the previous window of the same length. Optional for the same reason as `role`. */
  comparison?: {
    salesAmount: MetricComparison;
    debtsAmount: MetricComparison;
  };
}
export type SellersReportResponse = ApiResponse<SellerReportRow[]>;

/* ------------------------------------------------------------------ */
/* Business overview — GET /dashboard/overview                         */
/* ------------------------------------------------------------------ */

export interface OverviewSales {
  /** Revenue from cash/card sales, net of refunds. */
  saleRevenue: number;
  /** Value handed out on credit in the period, net of refunds. */
  debtIssued: number;
  /** Everything that left the shelves in money terms: sales + debts. */
  netRevenue: number;
  unitsSold: number;
  refundedUnits: number;
  discountAmount: number;
  transactionCount: number;
  saleCount: number;
  debtCount: number;
  averageCheck: number;
  comparison: {
    netRevenue: MetricComparison;
    transactionCount: MetricComparison;
    averageCheck: MetricComparison;
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
  /**
   * How many payments that is. The backend does not narrow `collectedAmount`
   * and this count to the picked seller (they stay market-wide), so the UI must
   * not present them as the seller's own when a seller filter is on.
   */
  collectedCount?: number;
}

export interface ReturnedProductRow {
  productId: string;
  productName: string;
  refundedUnits: number;
  returnRate: number;
}

export interface OverviewReturns {
  amount: number;
  units: number;
  returnRate: number;
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
  comparison: MetricComparison;
}

/** The windows the figures were counted in. `durationDays` is at least 1. */
export interface OverviewPeriod {
  current: { gte: string; lte: string };
  previous: { gte: string; lte: string };
  durationDays: number;
}

export interface OverviewData {
  /** Optional: copies saved on a phone before the backend sent it have no such field. */
  period?: OverviewPeriod;
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
