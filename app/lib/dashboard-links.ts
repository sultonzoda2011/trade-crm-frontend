import type { Period } from '~/config/period';
import { getPeriodDateParams } from '~/lib/date';
import { Role } from '~/types/common';
import type { SellerReportRow } from '~/types/dashboard';

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

/** Who is looking at the sellers report, as far as "where does a row lead" is concerned. */
export interface SellerLinkViewer {
  id?: string;
  canViewUsers: boolean;
  canViewSellers: boolean;
}

/**
 * Where a row of the sellers report opens.
 *
 * The report lists everyone who made sales, and that includes the owner (and an
 * admin) — not only people with the SELLER role. The seller card (`/sellers/:id`)
 * exists for sellers alone, so sending the owner there ends in "not found". So:
 *
 *  - the row is the viewer themselves  → their own profile (`/profile`), which is
 *    where an owner lands from their own row;
 *  - another seller                    → the seller card;
 *  - another owner or admin            → the user card (`/users/:id`), which only an
 *    admin may open.
 *
 * No access means no link: a dead end that ends on a 403 page is worse than a row
 * that simply does not open. A deleted account (`null`) has nothing to open.
 */
export function sellerRowLink(seller: SellerReportRow['seller'], viewer: SellerLinkViewer): string | undefined {
  if (!seller) return undefined;
  if (viewer.id && seller.id === viewer.id) return '/profile';

  // `role` is missing in copies saved before the backend sent it: those are plain sellers.
  const isSeller = !seller.role || seller.role === Role.Seller;
  if (isSeller) return viewer.canViewSellers ? `/sellers/${seller.id}` : undefined;
  return viewer.canViewUsers ? `/users/${seller.id}` : undefined;
}
