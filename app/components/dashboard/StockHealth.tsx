import { Ban, CheckCircle2, ChevronRight, PackageMinus, PackageX, TrendingDown, TriangleAlert, Undo2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { ROW_TONE, type RowTone } from '~/components/dashboard/rowTone';
import { Panel } from '~/components/layout/Panel';
import { Button } from '~/components/ui/button';
import { STOCK_ANALYSIS_DAYS } from '~/config/dashboard';
import { fmtNum, fmtTJS } from '~/lib/format';
import { cn } from '~/lib/utils';
import type { OverviewInventory } from '~/types/dashboard';

interface HealthRow {
  key: 'OUT_OF_STOCK' | 'CRITICAL' | 'LOW_STOCK' | 'HIGH_RETURNS' | 'SLOW_MOVING' | 'NO_SALES';
  icon: LucideIcon;
  tone: RowTone;
  count: (inventory: OverviewInventory) => number;
}

/** From most to least pressing. A product sits in exactly one of these (or is healthy). */
const ROWS: HealthRow[] = [
  { key: 'OUT_OF_STOCK', icon: PackageX, tone: 'danger', count: (i) => i.outOfStock },
  { key: 'CRITICAL', icon: TriangleAlert, tone: 'danger', count: (i) => i.critical },
  { key: 'LOW_STOCK', icon: PackageMinus, tone: 'warning', count: (i) => i.lowStock },
  { key: 'HIGH_RETURNS', icon: Undo2, tone: 'warning', count: (i) => i.highReturns },
  { key: 'SLOW_MOVING', icon: TrendingDown, tone: 'neutral', count: (i) => i.slowMoving },
  { key: 'NO_SALES', icon: Ban, tone: 'neutral', count: (i) => i.noSales },
];

interface StockHealthProps {
  inventory: OverviewInventory;
  /** How many days of stock make a product "slow-moving"; the backend reports it in its recommendation. */
  slowMovingDays?: number;
}

/**
 * The whole shop in one card: how much goods there are, and how many products
 * are in which state.
 *
 * Two honest limits are written on the card instead of hidden:
 *  - the product has a selling price and no purchase price, so "goods in stock" is
 *    valued at the selling price — what the shelf brings if it all sells, not what
 *    was paid for it;
 *  - only slow-moving stock is valued by the backend. Products with no sales at all
 *    are counted but have no amount, so the card does not claim a total "frozen" sum.
 *
 * States with nothing in them are not drawn: six zero rows would hide the one
 * that matters. Every row opens the product list filtered by the same state.
 */
export function StockHealth({ inventory, slowMovingDays }: StockHealthProps) {
  const { t } = useTranslation(['dashboard', 'products']);

  if (inventory.totalProducts === 0) {
    return (
      <Panel title={t('stockHealth.title')} bodyClassName="flex flex-col items-start gap-3">
        <div>
          <p className="text-base leading-snug font-semibold">{t('stockHealth.empty')}</p>
          <p className="text-muted-foreground mt-0.5 text-sm leading-snug">{t('stockHealth.emptyHint')}</p>
        </div>
        <Button variant="outline" size="lg" className="w-full" render={<Link to="/products" />}>
          {t('stockHealth.emptyAction')}
        </Button>
      </Panel>
    );
  }

  const rows = ROWS.map((row) => ({ ...row, value: row.count(inventory) })).filter((row) => row.value > 0);

  return (
    <Panel title={t('stockHealth.title')} bodyClassName="overflow-hidden p-0">
      <div className="px-4 pt-4 pb-3">
        <p className="text-muted-foreground text-sm font-medium">{t('stockHealth.total')}</p>
        <p className="mt-1 font-mono text-3xl leading-tight font-bold tabular-nums break-words md:text-4xl">
          {fmtTJS(inventory.stockValue)}
        </p>
        <p className="text-muted-foreground mt-1 text-sm leading-snug">{t('stockHealth.totalHint')}</p>
      </div>

      {rows.length === 0 ? (
        <div className="border-border flex items-center gap-3 border-t px-4 py-4">
          <span className="bg-success/10 text-success flex size-10 shrink-0 items-center justify-center rounded-full">
            <CheckCircle2 className="size-5" />
          </span>
          <p className="text-base leading-snug font-semibold">{t('stockHealth.allHealthy')}</p>
        </div>
      ) : (
        <div className="divide-border border-border divide-y border-t">
          {rows.map((row) => {
            const Icon = row.icon;
            let hint: string;
            if (row.key === 'SLOW_MOVING') {
              hint = slowMovingDays
                ? t('stockHealth.hint.SLOW_MOVING', { days: slowMovingDays, amount: fmtTJS(inventory.slowMovingValue) })
                : t('stockHealth.hint.SLOW_MOVING_NO_DAYS', { amount: fmtTJS(inventory.slowMovingValue) });
            } else if (row.key === 'NO_SALES') {
              hint = t('stockHealth.hint.NO_SALES', { days: STOCK_ANALYSIS_DAYS });
            } else {
              hint = t(`stockHealth.hint.${row.key}`);
            }

            return (
              <Link
                key={row.key}
                to={`/products?health=${row.key}`}
                className="active:bg-muted/70 flex min-h-16 items-center gap-3 px-4 py-3 transition-colors">
                <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', ROW_TONE[row.tone].badge)}>
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="min-w-0 text-base leading-snug font-semibold">
                      {t(`health.${row.key}`, { ns: 'products' })}
                    </span>
                    <span className={cn('shrink-0 font-mono text-base font-semibold tabular-nums', ROW_TONE[row.tone].amount)}>
                      {fmtNum(row.value)}
                    </span>
                  </span>
                  <span className="text-muted-foreground mt-0.5 block text-sm leading-snug">{hint}</span>
                </span>
                <ChevronRight className="text-muted-foreground/60 -mr-1 size-4 shrink-0" />
              </Link>
            );
          })}
        </div>
      )}

      {rows.length > 0 && (
        <p className="text-muted-foreground border-border border-t px-4 py-3 text-sm leading-snug">
          {t('stockHealth.healthy', { healthy: inventory.healthy, total: inventory.totalProducts })}
        </p>
      )}
    </Panel>
  );
}
