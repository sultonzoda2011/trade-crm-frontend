import type { MetricComparison } from '~/types/analytics';
import type { SellerReportRow } from '~/types/dashboard';

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Same arithmetic as the backend's `buildComparison`: growth from zero has no
 * percentage (`null`), everything else is the change to one decimal.
 */
function compare(current: number, previous: number): MetricComparison {
  const difference = round2(current - previous);
  return {
    current: round2(current),
    previous: round2(previous),
    difference,
    changePercent: previous === 0 ? null : Math.round((difference / Math.abs(previous)) * 1000) / 10,
  };
}

/**
 * What one seller put on the counter in the period: cash and card sales (already
 * net of the returns of their sales) plus goods handed out on credit. It is the
 * same definition as "Sold" on the Overview, so the rows add up to that figure.
 */
export function soldOf(row: SellerReportRow): number {
  return round2(row.salesAmount + row.debtsAmount);
}

/**
 * "Sold" against the previous window, for one row. The report sends the two
 * parts (sales, credit) separately, so they are added here. `null` when the
 * backend sent no comparison at all (a copy saved before the field existed).
 */
export function soldComparison(row: SellerReportRow): MetricComparison | null {
  const parts = row.comparison;
  if (!parts) return null;
  return compare(
    parts.salesAmount.current + parts.debtsAmount.current,
    parts.salesAmount.previous + parts.debtsAmount.previous
  );
}

/**
 * Best seller first. The backend orders by cash and card sales only, which would
 * put someone who sold a lot on credit at the bottom of a list headed "Sold" —
 * so the order follows the same figure the row shows.
 */
export function rankSellers(rows: SellerReportRow[]): SellerReportRow[] {
  return [...rows].sort((a, b) => {
    const diff = soldOf(b) - soldOf(a);
    if (diff !== 0) return diff;
    return (a.seller?.name ?? '').localeCompare(b.seller?.name ?? '');
  });
}

export interface SellersTotals {
  sold: number;
  cash: number;
  credit: number;
  refunds: number;
  /** Someone sold or gave on credit in the period itself (rows that only existed in the previous window don't count). */
  hasSales: boolean;
  /** `null` unless every row carried a comparison — a partial sum would be a wrong number. */
  comparison: MetricComparison | null;
}

export function summarize(rows: SellerReportRow[]): SellersTotals {
  let cash = 0;
  let credit = 0;
  let refunds = 0;
  let hasSales = false;
  let current = 0;
  let previous = 0;
  let comparable = rows.length > 0;

  for (const row of rows) {
    cash += row.salesAmount;
    credit += row.debtsAmount;
    refunds += row.refundsAmount;
    if (row.salesCount + row.debtsCount > 0) hasSales = true;

    const comparison = soldComparison(row);
    if (comparison) {
      current += comparison.current;
      previous += comparison.previous;
    } else {
      comparable = false;
    }
  }

  return {
    sold: round2(cash + credit),
    cash: round2(cash),
    credit: round2(credit),
    refunds: round2(refunds),
    hasSales,
    comparison: comparable ? compare(current, previous) : null,
  };
}
