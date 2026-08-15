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
 * The headline is the money that came back, because that is what the period
 * actually lost. Growth here is bad news, hence the inverted comparison
 * colours. Per-product rates are only shown for products the backend already
 * considered statistically meaningful.
 */
export function ReturnsPanel({ returns, className }: ReturnsPanelProps) {
  const { t } = useTranslation('dashboard');

  return (
    <Panel title={t('returns.title')} className={cn('space-y-4', className)}>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground text-xs">{t('returns.amount')}</p>
          <p className="font-mono text-xl font-bold">{fmtTJS(returns.amount)}</p>
          <ComparisonIndicator comparison={returns.comparison.amount} invert className="mt-1" />
        </div>
        <div>
          <p className="text-muted-foreground text-xs">{t('returns.rate')}</p>
          <p className="font-mono text-xl font-bold">{percent(returns.returnRate)}</p>
          <ComparisonIndicator comparison={returns.comparison.returnRate} invert className="mt-1" />
        </div>
        <div>
          <p className="text-muted-foreground text-xs">{t('returns.units')}</p>
          <p className="font-mono text-xl font-bold">{returns.units}</p>
        </div>
      </div>

      {returns.topProducts.length > 0 && (
        <div className="border-border space-y-2 border-t pt-3">
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
            <Undo2 className="h-3.5 w-3.5" />
            {t('returns.topProducts')}
          </p>
          <div className="divide-border divide-y">
            {returns.topProducts.map((product) => (
              <Link
                key={product.productId}
                to={`/products/${product.productId}`}
                className="hover:bg-muted/40 -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2 transition-colors">
                <span className="min-w-0 truncate text-sm">{product.productName}</span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="text-muted-foreground text-xs">
                    {t('returns.unitsBack', { count: product.refundedUnits })}
                  </span>
                  <span className="text-destructive font-mono text-sm font-medium">
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
