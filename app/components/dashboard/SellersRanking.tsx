import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { ComparisonIndicator } from '~/components/dashboard/ComparisonIndicator';
import { Panel } from '~/components/layout/Panel';
import { EntityAvatar } from '~/components/shared/EntityAvatar';
import { Badge } from '~/components/ui/badge';
import { SELLERS_VISIBLE } from '~/config/dashboard';
import { ROLE_CONFIG } from '~/config/enumOptions';
import { fmtTJS } from '~/lib/format';
import { soldComparison, soldOf } from '~/lib/seller-report';
import { cn } from '~/lib/utils';
import { Role } from '~/types/common';
import type { SellerReportRow } from '~/types/dashboard';

interface SellersRankingProps {
  /** Best seller first (see `rankSellers`). */
  rows: SellerReportRow[];
  /** What all the rows sold together — the whole a share is a share of. */
  totalSold: number;
  /** The window is long enough to compare with the previous one. */
  comparable: boolean;
  /** Where a row opens; `undefined` — it does not open (no access, or the account is gone). */
  getLink: (seller: SellerReportRow['seller']) => string | undefined;
  /** Router state for the link, so the card opened shows a way back to this tab. */
  linkState: unknown;
}

interface SellerRowProps {
  row: SellerReportRow;
  /** The biggest figure in the list — the bar of the best seller is full. */
  max: number;
  totalSold: number;
  /** Share and bar say nothing when there is one row only (one seller picked). */
  showShare: boolean;
  comparable: boolean;
  to: string | undefined;
  state: unknown;
}

function SellerRow({ row, max, totalSold, showShare, comparable, to, state }: SellerRowProps) {
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');

  const seller = row.seller;
  const sold = soldOf(row);
  const share = totalSold > 0 ? (sold / totalSold) * 100 : null;
  const width = max > 0 ? `${Math.round((sold / max) * 100)}%` : '0%';
  const comparison = comparable ? soldComparison(row) : null;

  // The owner and an admin sell too; the label tells them apart from the sellers.
  const roleBadge = seller?.role && seller.role !== Role.Seller ? ROLE_CONFIG[seller.role] : undefined;

  // Each part stays on one line ("On credit 1 800 TJS" never breaks in the middle); they wrap as a whole.
  const parts: string[] = [];
  if (row.salesAmount > 0) parts.push(`${t('sellersTab.cash')} ${fmtTJS(row.salesAmount)}`);
  if (row.debtsAmount > 0) parts.push(`${t('sellersTab.credit')} ${fmtTJS(row.debtsAmount)}`);

  let trend: ReactNode = null;
  if (comparison) {
    trend =
      comparison.previous > 0 ? (
        <ComparisonIndicator comparison={comparison} className="text-sm" />
      ) : sold > 0 ? (
        <span className="text-muted-foreground">{t('sellersTab.noPrevious')}</span>
      ) : null;
  }

  const body = (
    <>
      <EntityAvatar name={seller?.name ?? '?'} image={seller?.image} size="md" className="mt-0.5" />

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={cn('text-base leading-snug font-semibold break-words', !seller && 'text-muted-foreground')}>
              {seller?.name ?? t('sellersTab.deleted')}
            </span>
            {roleBadge && (
              <Badge variant="outline" className={roleBadge.className}>
                {roleBadge.label(tCommon)}
              </Badge>
            )}
          </span>
          <span
            className={cn(
              'shrink-0 font-mono text-base font-semibold tabular-nums',
              sold === 0 && 'text-muted-foreground'
            )}>
            {fmtTJS(sold)}
          </span>
        </span>

        <span className="text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 text-sm leading-snug">
          {parts.length > 0
            ? parts.map((part) => (
                <span key={part} className="whitespace-nowrap">
                  {part}
                </span>
              ))
            : t('sellersTab.noSalesRow')}
        </span>

        {showShare && sold > 0 && (
          <span className="bg-muted mt-2 block h-1.5 w-full overflow-hidden rounded-full">
            <span className="bg-primary block h-full rounded-full" style={{ width }} />
          </span>
        )}

        {((showShare && share !== null && sold > 0) || trend) && (
          <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm leading-snug">
            {showShare && share !== null && sold > 0 && (
              <span className="text-muted-foreground">
                {share < 1 ? t('sellersTab.shareLow') : t('sellersTab.share', { percent: Math.round(share) })}
              </span>
            )}
            {trend}
          </span>
        )}

        {row.refundsAmount > 0 && (
          <span className="text-destructive mt-1 block text-sm leading-snug">
            {t('sellersTab.returns', { amount: fmtTJS(row.refundsAmount) })}
          </span>
        )}
      </span>

      {to && <ChevronRight className="text-muted-foreground/60 mt-3 -mr-1 size-4 shrink-0" />}
    </>
  );

  const className = 'flex min-h-16 items-start gap-3 px-4 py-3';

  return to ? (
    <Link to={to} state={state} className={cn(className, 'active:bg-muted/70 transition-colors')}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/**
 * Who sold how much, best first.
 *
 * Every seller the backend sends is reachable: the first few are shown and the rest
 * open with "Show all" — cutting the list silently would leave shares that do not add
 * up and a total that does not match the rows. The figures are the Overview's
 * ("Sold" = cash and card sales net of returns + goods on credit), split per person.
 * A return is taken off the seller who made the sale, not whoever processed the
 * return — the hint under the title says so, otherwise a seller with returns they
 * never made would look like a mistake.
 */
export function SellersRanking({ rows, totalSold, comparable, getLink, linkState }: SellersRankingProps) {
  const { t } = useTranslation('dashboard');
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? rows : rows.slice(0, SELLERS_VISIBLE);
  const hidden = rows.length - SELLERS_VISIBLE;
  const max = Math.max(...rows.map(soldOf), 0);

  return (
    <Panel title={t('sellersTab.title')} bodyClassName="overflow-hidden p-0">
      <p className="text-muted-foreground px-4 pt-3 pb-2 text-sm leading-snug">{t('sellersTab.hint')}</p>

      <div className="divide-border border-border divide-y border-t">
        {visible.map((row, index) => (
          <SellerRow
            key={row.seller?.id ?? `deleted-${index}`}
            row={row}
            max={max}
            totalSold={totalSold}
            showShare={rows.length > 1}
            comparable={comparable}
            to={getLink(row.seller)}
            state={linkState}
          />
        ))}
      </div>

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="text-primary border-border flex min-h-12 w-full items-center justify-center gap-1 border-t px-4 text-base font-medium active:opacity-60">
          {expanded ? t('sellersTab.showLess') : t('sellersTab.showAll', { count: rows.length })}
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      )}
    </Panel>
  );
}
