import { Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { ComparisonIndicator } from '~/components/dashboard/ComparisonIndicator';
import { Panel } from '~/components/layout/Panel';
import { fmtTJS } from '~/lib/format';
import { cn } from '~/lib/utils';
import type { OverviewReturns } from '~/types/dashboard';

interface ReturnsPanelProps {
  returns: OverviewReturns;
  className?: string;
}

const percent = (rate: number) => `${Math.round(rate * 1000) / 10}%`;

/**
 * Returns as a cost, not as a transaction type.
 *
 * The headline is the money that came back, because that is what
 * the period actually lost. Growth here is bad news, hence the
 * inverted comparison colours.
 *
 * Per-product rates are only shown for products the backend already
 * considered statistically meaningful.
 */
export function ReturnsPanel({ returns, className }: ReturnsPanelProps) {
  const { t } = useTranslation('dashboard');

  return (
    <Panel title={t('returns.title')} className={cn('space-y-4 sm:space-y-5', className)}>
      {/* Summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {/* Amount */}
        <div className="min-w-0 rounded-lg border p-3 sm:border-0 sm:p-0">
          <p className="text-muted-foreground text-xs font-medium">{t('returns.amount')}</p>

          <p className="mt-1 truncate font-mono text-lg font-bold sm:text-xl">{fmtTJS(returns.amount)}</p>

          <ComparisonIndicator comparison={returns.comparison.amount} invert className="mt-1" />
        </div>

        {/* Rate */}
        <div className="min-w-0 rounded-lg border p-3 sm:border-0 sm:p-0">
          <p className="text-muted-foreground text-xs font-medium">{t('returns.rate')}</p>

          <p className="mt-1 font-mono text-lg font-bold sm:text-xl">{percent(returns.returnRate)}</p>

          <ComparisonIndicator comparison={returns.comparison.returnRate} invert className="mt-1" />
        </div>

        {/* Units */}
        <div className="min-w-0 rounded-lg border p-3 sm:border-0 sm:p-0">
          <p className="text-muted-foreground text-xs font-medium">{t('returns.units')}</p>

          <p className="mt-1 font-mono text-lg font-bold sm:text-xl">{returns.units}</p>
        </div>
      </div>

      {/* Top returned products */}
      {returns.topProducts.length > 0 && (
        <div className="border-border space-y-3 border-t pt-4">
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold">
            <Undo2 className="h-3.5 w-3.5 shrink-0" />
            <span>{t('returns.topProducts')}</span>
          </p>

          <div className="divide-border divide-y">
            {returns.topProducts.map((product) => (
              <Link
                key={product.productId}
                to={`/products/${product.productId}`}
                className={cn(
                  'hover:bg-muted/40',
                  '-mx-1 flex min-w-0 items-center gap-3 rounded-md px-2.5 py-2.5',
                  'transition-colors',
                  'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none'
                )}>
                {/* Product name */}
                <span className="min-w-0 flex-1 truncate text-sm">{product.productName}</span>

                {/* Product stats */}
                <span className="flex shrink-0 items-center gap-2 sm:gap-3">
                  <span className="text-muted-foreground text-xs whitespace-nowrap">
                    {t('returns.unitsBack', {
                      count: product.refundedUnits,
                    })}
                  </span>

                  <span className="text-destructive min-w-10.5 text-right font-mono text-sm font-medium">
                    {percent(product.returnRate)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
