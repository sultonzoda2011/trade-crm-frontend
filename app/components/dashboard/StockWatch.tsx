import { CheckCircle2, ChevronRight, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { StockRow } from '~/components/dashboard/StockRow';
import { Panel } from '~/components/layout/Panel';
import { PanelViewAll } from '~/components/shared/PanelViewAll';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { STOCK_ANALYSIS_DAYS, STOCK_ROWS_VISIBLE } from '~/config/dashboard';
import { fmtTJS } from '~/lib/format';
import type { OverviewData } from '~/types/dashboard';

interface StockWatchProps {
  /** The overview read over the fixed trailing window (see `dashboardApi.getStockOverview`). */
  data?: OverviewData;
  isLoading: boolean;
  isError: boolean;
  /** No saved copy and no connection: say so instead of spinning forever. */
  isOffline: boolean;
  onRetry: () => void;
  /** A seller is picked in the filter bar — stock does not follow it, and the card says so. */
  sellerScoped: boolean;
}

/**
 * "What is running out" — the products the owner should think about buying.
 *
 * Everything here comes from the backend's reorder rules over the last
 * `STOCK_ANALYSIS_DAYS` days. The card names that window, says how it reached
 * each conclusion, and offers no "add to purchase" button because the app has no
 * purchase list — the row opens the product, where the stock can be adjusted.
 */
export function StockWatch({ data, isLoading, isError, isOffline, onRetry, sellerScoped }: StockWatchProps) {
  const { t } = useTranslation('dashboard');

  if (!data) {
    if (isLoading) {
      return (
        <Panel title={t('stock.title')} bodyClassName="space-y-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </Panel>
      );
    }
    return (
      <Panel title={t('stock.title')} bodyClassName="flex flex-col items-center gap-3 py-6 text-center">
        {isOffline && <WifiOff className="text-muted-foreground/50 size-8" />}
        <p className="text-muted-foreground text-sm">{isOffline ? t('stock.offline') : t('stock.loadError')}</p>
        {!isOffline && isError && (
          <Button variant="outline" onClick={onRetry}>
            {t('actions.retry', { ns: 'common' })}
          </Button>
        )}
      </Panel>
    );
  }

  const { inventory, products, sales } = data;
  const rows = products.reorder.slice(0, STOCK_ROWS_VISIBLE);
  const noSalesInWindow = sales.transactionCount === 0;

  const slowDays = data.insights.find((insight) => insight.id === 'inventory.slowMoving')?.params.days;

  return (
    <Panel
      title={t('stock.title')}
      bodyClassName="overflow-hidden p-0"
      actions={
        inventory.needsReorder > 0 ? (
          <PanelViewAll to="/products?needsReorder=true" label={t('viewAll')} count={inventory.needsReorder} />
        ) : undefined
      }>
      <div className="px-4 pt-3 pb-2">
        <p className="text-muted-foreground text-sm leading-snug">{t('stock.basis', { days: STOCK_ANALYSIS_DAYS })}</p>
        {sellerScoped && <p className="text-muted-foreground mt-1 text-sm leading-snug">{t('stock.allShop')}</p>}
        {noSalesInWindow && <p className="text-warning mt-1 text-sm leading-snug">{t('stock.noSalesData', { days: STOCK_ANALYSIS_DAYS })}</p>}
      </div>

      {rows.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-4">
          <span className="bg-success/10 text-success flex size-10 shrink-0 items-center justify-center rounded-full">
            <CheckCircle2 className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-base leading-snug font-semibold">{t('stock.allGood')}</p>
            <p className="text-muted-foreground text-sm leading-snug">{t('stock.allGoodHint')}</p>
          </div>
        </div>
      ) : (
        <div className="divide-border border-border divide-y border-t">
          {rows.map((product) => (
            <StockRow key={product.id} product={product} />
          ))}
        </div>
      )}

      {rows.length > 0 && <p className="text-muted-foreground border-border border-t px-4 py-3 text-sm leading-snug">{t('stock.orderNote')}</p>}

      {inventory.slowMoving > 0 && (
        <Link
          to="/products?health=SLOW_MOVING"
          className="active:bg-muted/70 border-border flex items-center gap-3 border-t px-4 py-3 transition-colors">
          <span className="text-muted-foreground min-w-0 flex-1 text-sm leading-snug">
            {slowDays
              ? t('stock.slowMoving', {
                  count: inventory.slowMoving,
                  amount: fmtTJS(inventory.slowMovingValue),
                  days: slowDays,
                })
              : t('stock.slowMovingNoDays', {
                  count: inventory.slowMoving,
                  amount: fmtTJS(inventory.slowMovingValue),
                })}
          </span>
          <ChevronRight className="text-muted-foreground/60 -mr-1 size-4 shrink-0" />
        </Link>
      )}
    </Panel>
  );
}
