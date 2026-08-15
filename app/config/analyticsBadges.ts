import type { TFunction } from 'i18next';
import type {
  DebtorRisk,
  DebtStatusFilter,
  InsightSeverity,
  ProductHealth,
  ReorderPriority,
} from '~/types/analytics';

/**
 * Semantic colours for computed business states.
 *
 * Only the existing semantic tokens are used (destructive / warning / success /
 * muted / primary) so the palette follows the theme in both light and dark
 * mode. The same state always gets the same colour on every screen — a product
 * that is CRITICAL on the dashboard must not look different in the table.
 */

export const PRODUCT_HEALTH_BADGE: Record<ProductHealth, string> = {
  OUT_OF_STOCK: 'border-destructive/40 bg-destructive/15 text-destructive',
  CRITICAL: 'border-destructive/40 bg-destructive/15 text-destructive',
  LOW_STOCK: 'border-warning/40 bg-warning/15 text-warning',
  HIGH_RETURNS: 'border-warning/40 bg-warning/15 text-warning',
  // Не проблема, но и не норма: деньги стоят на полке.
  SLOW_MOVING: 'border-muted-foreground/30 bg-muted text-muted-foreground',
  NO_SALES: 'border-muted-foreground/30 bg-muted text-muted-foreground',
  HEALTHY: 'border-success/40 bg-success/15 text-success',
};

export const REORDER_PRIORITY_BADGE: Record<ReorderPriority, string> = {
  OUT_OF_STOCK: 'border-destructive/40 bg-destructive/15 text-destructive',
  CRITICAL: 'border-destructive/40 bg-destructive/15 text-destructive',
  WARNING: 'border-warning/40 bg-warning/15 text-warning',
  OK: 'border-success/40 bg-success/15 text-success',
  NOT_NEEDED: 'border-muted-foreground/30 bg-muted text-muted-foreground',
};

export const DEBTOR_RISK_BADGE: Record<DebtorRisk, string> = {
  HIGH: 'border-destructive/40 bg-destructive/15 text-destructive',
  MEDIUM: 'border-warning/40 bg-warning/15 text-warning',
  LOW: 'border-success/40 bg-success/15 text-success',
};

export const INSIGHT_SEVERITY_BADGE: Record<InsightSeverity, string> = {
  critical: 'border-destructive/40 bg-destructive/15 text-destructive',
  warning: 'border-warning/40 bg-warning/15 text-warning',
  info: 'border-primary/40 bg-primary/10 text-primary',
  success: 'border-success/40 bg-success/15 text-success',
};

/** Left accent stripe of an insight card — same severity scale, border only. */
export const INSIGHT_SEVERITY_ACCENT: Record<InsightSeverity, string> = {
  critical: 'border-l-destructive',
  warning: 'border-l-warning',
  info: 'border-l-primary',
  success: 'border-l-success',
};

/**
 * Filter option builders. Values are the backend enum members verbatim —
 * they travel to the API as query parameters, so they must not be localised.
 */

export const getProductHealthOptions = (t: TFunction) =>
  (
    [
      'OUT_OF_STOCK',
      'CRITICAL',
      'LOW_STOCK',
      'HIGH_RETURNS',
      'SLOW_MOVING',
      'NO_SALES',
      'HEALTHY',
    ] satisfies ProductHealth[]
  ).map((value) => ({ value, label: t(`health.${value}`) }));

export const getReorderPriorityOptions = (t: TFunction) =>
  (['OUT_OF_STOCK', 'CRITICAL', 'WARNING', 'OK', 'NOT_NEEDED'] satisfies ReorderPriority[]).map(
    (value) => ({ value, label: t(`reorderPriority.${value}`) })
  );

export const getDebtorRiskOptions = (t: TFunction) =>
  (['HIGH', 'MEDIUM', 'LOW'] satisfies DebtorRisk[]).map((value) => ({
    value,
    label: t(`risk.${value}`),
  }));

export const getDebtStatusOptions = (t: TFunction) =>
  (['OVERDUE', 'DUE_SOON', 'OUTSTANDING', 'SETTLED'] satisfies DebtStatusFilter[]).map((value) => ({
    value,
    label: t(`debtStatus.${value}`),
  }));
