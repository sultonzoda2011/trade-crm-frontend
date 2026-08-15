/**
 * Types shared by every analytics surface (dashboard, products, debtors).
 *
 * The string unions mirror the backend enums one-to-one. They are duplicated
 * here rather than imported because the two apps are separate repositories —
 * the compiler cannot cross-check them, so any change on the backend must be
 * mirrored here deliberately.
 */

/** How urgently a product has to be restocked. Mirrors backend ReorderPriority. */
export type ReorderPriority = 'OUT_OF_STOCK' | 'CRITICAL' | 'WARNING' | 'OK' | 'NOT_NEEDED';

/** Business state of a product, not just its stock level. Mirrors backend ProductHealth. */
export type ProductHealth =
  | 'OUT_OF_STOCK'
  | 'CRITICAL'
  | 'LOW_STOCK'
  | 'HIGH_RETURNS'
  | 'NO_SALES'
  | 'SLOW_MOVING'
  | 'HEALTHY';

/** Computed repayment risk of a debtor. Mirrors backend DebtorRisk. */
export type DebtorRisk = 'HIGH' | 'MEDIUM' | 'LOW';

/** Settlement state of a debt, derived at request time. Mirrors backend DebtStatusFilter. */
export type DebtStatusFilter = 'OVERDUE' | 'DUE_SOON' | 'OUTSTANDING' | 'SETTLED';

/** Severity of a recommendation. Values match the semantic colour names. */
export type InsightSeverity = 'critical' | 'warning' | 'info' | 'success';

export type InsightCategory = 'inventory' | 'sales' | 'debts' | 'returns';

/**
 * Period-over-period comparison of a single metric.
 *
 * `changePercent` is null when the previous value was zero: growth from
 * nothing has no percentage, and rendering +100% there would be a lie.
 * Every consumer must handle the null branch instead of defaulting to 0.
 */
export interface MetricComparison {
  current: number;
  previous: number;
  difference: number;
  changePercent: number | null;
}

/** Sales-velocity and stock metrics computed for one product over a period. */
export interface ProductMetrics {
  productId: string;
  unitsSold: number;
  refundedUnits: number;
  netUnitsSold: number;
  revenue: number;
  transactionCount: number;
  /** Share of sold units that came back, 0..1. Zero below the volume floor. */
  returnRate: number;
  avgDailySales: number;
  /** How many days the current stock lasts. null — no sales, so unknown. */
  daysOfStockRemaining: number | null;
  reorderPriority: ReorderPriority;
  /** How much to order. 0 — no order needed. */
  recommendedQuantity: number;
  health: ProductHealth;
}

/**
 * One recommendation from the backend rules engine.
 *
 * The backend sends a translation key and parameters, never a finished
 * sentence — the same rule has to read correctly in ru/en/tg.
 */
export interface BusinessInsight {
  id: string;
  severity: InsightSeverity;
  category: InsightCategory;
  messageKey: string;
  params: Record<string, string | number>;
  action?: {
    route: string;
    query?: Record<string, string>;
  };
}
