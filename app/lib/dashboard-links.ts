import type { Period } from '~/config/period';
import { getPeriodDateParams } from '~/lib/date';

/** What the dashboard filter bar has selected — the scope every figure was counted in. */
export interface DashboardScope {
  period: Period;
  sellerId?: string;
}

type Query = Record<string, string | undefined>;

function withQuery(path: string, query: Query): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

/**
 * A card on the dashboard counts rows inside a window and for one seller; the
 * list it opens has to show those same rows. Cards used to link to a bare
 * `/transactions`, so "42 transactions this week" opened every transaction ever
 * made. The link now carries the window (`dateFrom`/`dateTo`, the exact days the
 * header prints) and the picked seller (`createdById`), and the list shows both
 * as removable chips.
 *
 * `extra` carries the card's own condition (`type=REFUND`, `debtStatus=OVERDUE`).
 */
export function transactionsLink(scope: DashboardScope, extra: Query = {}): string {
  return withQuery('/transactions', {
    ...getPeriodDateParams(scope.period),
    createdById: scope.sellerId,
    ...extra,
  });
}

/**
 * Debt position (overdue, due soon) is a snapshot of *now*, not of the period, so
 * it is deliberately not date-bounded — only narrowed to the seller, because the
 * backend scopes the debt figures by `createdById` too.
 */
export function debtsLink(scope: DashboardScope, extra: Query = {}): string {
  return withQuery('/transactions', { createdById: scope.sellerId, ...extra });
}
