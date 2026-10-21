import { CheckCircle2, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { ComparisonIndicator } from '~/components/dashboard/ComparisonIndicator';
import { Panel } from '~/components/layout/Panel';
import { STOCK_ANALYSIS_DAYS } from '~/config/dashboard';
import { fmtTJS } from '~/lib/format';
import type { OverviewReturns } from '~/types/dashboard';

interface ReturnsPanelProps {
  returns: OverviewReturns;
}

const percent = (rate: number) => `${Math.round(rate * 1000) / 10}%`;

/**
 * What customers bring back, over the same window the rest of the Inventory tab
 * uses, for the whole shop.
 *
 * The comparison with the previous window is shown only when there was something
 * to compare with: "nothing to compare" under every figure is noise, and a
 * percentage from zero is not a percentage. Returns are bad news, so the
 * indicator is inverted (more returns is red).
 *
 * The amount is the backend's figure and is priced at list price, so with
 * discounts it can differ a little from what was actually refunded.
 */
export function ReturnsPanel({ returns }: ReturnsPanelProps) {
  const { t } = useTranslation('dashboard');

  if (returns.units === 0) {
    return (
      <Panel title={t('returnsCard.title')} bodyClassName="space-y-1">
        <p className="text-muted-foreground text-sm leading-snug">{t('returnsCard.basis', { days: STOCK_ANALYSIS_DAYS })}</p>
        <div className="flex items-center gap-3 pt-2">
          <span className="bg-success/10 text-success flex size-10 shrink-0 items-center justify-center rounded-full">
            <CheckCircle2 className="size-5" />
          </span>
          <p className="text-base leading-snug font-semibold">{t('returnsCard.none')}</p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title={t('returnsCard.title')} bodyClassName="overflow-hidden p-0">
      <div className="px-4 pt-3 pb-3">
        <p className="text-muted-foreground text-sm leading-snug">{t('returnsCard.basis', { days: STOCK_ANALYSIS_DAYS })}</p>
        <p className="mt-2 font-mono text-3xl leading-tight font-bold tabular-nums break-words md:text-4xl">
          {fmtTJS(returns.amount)}
        </p>
        <p className="text-muted-foreground mt-1 text-sm leading-snug">
          {t('returnsCard.summary', { units: returns.units, percent: Math.round(returns.returnRate * 1000) / 10 })}
        </p>
        {returns.comparison.amount.previous > 0 && (
          <ComparisonIndicator
            comparison={returns.comparison.amount}
            invert
            vsLabel={t('returnsCard.vs', { days: STOCK_ANALYSIS_DAYS })}
            className="mt-1 text-sm"
          />
        )}
      </div>

      {returns.topProducts.length > 0 && (
        <>
          <p className="text-muted-foreground border-border border-t px-4 pt-3 pb-1 text-sm font-medium">
            {t('returnsCard.top')}
          </p>
          <div className="divide-border divide-y">
            {returns.topProducts.map((product) => (
              <Link
                key={product.productId}
                to={`/products/${product.productId}`}
                className="active:bg-muted/70 flex min-h-14 items-center gap-3 px-4 py-3 transition-colors">
                <span className="min-w-0 flex-1">
                  <span className="block text-base leading-snug font-semibold break-words">{product.productName}</span>
                  <span className="text-muted-foreground block text-sm leading-snug">
                    {t('returnsCard.back', { units: product.refundedUnits })}
                  </span>
                </span>
                <span className="text-destructive shrink-0 font-mono text-base font-semibold tabular-nums">
                  {percent(product.returnRate)}
                </span>
                <ChevronRight className="text-muted-foreground/60 -mr-1 size-4 shrink-0" />
              </Link>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}
