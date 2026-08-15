import { PackageX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Panel } from '~/components/layout/Panel';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { REORDER_PRIORITY_BADGE } from '~/config/analyticsBadges';
import { fmtTJS } from '~/lib/format';
import { cn } from '~/lib/utils';
import type { OverviewProducts } from '~/types/dashboard';

interface ReorderListProps {
  products: OverviewProducts['reorder'];
  className?: string;
}

/**
 * "What to order right now", already sorted by urgency on the backend.
 *
 * Deliberately not a full table: the owner needs the name, how long the stock
 * lasts and how much to order. Everything else is one click away on the
 * products screen, which this panel links to with the same filter applied.
 */
export function ReorderList({ products, className }: ReorderListProps) {
  const { t } = useTranslation(['dashboard', 'products']);

  return (
    <Panel
      title={t('reorder.title')}
      className={cn('p-0', className)}
      actions={
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          render={<Link to="/products?needsReorder=true" />}>
          {t('viewAll')}
        </Button>
      }>
      {products.length === 0 ? (
        <p className="text-muted-foreground px-4 py-6 text-sm">{t('reorder.empty')}</p>
      ) : (
        <div className="divide-border divide-y">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="hover:bg-muted/40 flex items-center justify-between gap-3 px-4 py-3 transition-colors">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{product.name}</p>
                <p className="text-muted-foreground text-xs">
                  {product.metrics.daysOfStockRemaining === null
                    ? t('reorder.noVelocity')
                    : t('reorder.daysLeft', { days: product.metrics.daysOfStockRemaining })}
                  {' · '}
                  {t('reorder.inStock', { count: product.quantity })}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge
                  variant="outline"
                  className={REORDER_PRIORITY_BADGE[product.metrics.reorderPriority]}>
                  {t(`reorderPriority.${product.metrics.reorderPriority}`, { ns: 'products' })}
                </Badge>
                <span className="font-mono text-sm font-semibold">
                  +{product.metrics.recommendedQuantity}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Panel>
  );
}

interface InventoryHealthProps {
  inventory: {
    totalProducts: number;
    outOfStock: number;
    critical: number;
    lowStock: number;
    slowMoving: number;
    noSales: number;
    highReturns: number;
    healthy: number;
    needsReorder: number;
    stockValue: number;
    slowMovingValue: number;
  };
  className?: string;
}

/**
 * Stock as a business position rather than a row count.
 *
 * Each tile links to the products list filtered by the very state it counts,
 * so "12 critical" is a starting point for work, not a fact to memorise.
 */
export function InventoryHealth({ inventory, className }: InventoryHealthProps) {
  const { t } = useTranslation(['dashboard', 'products']);

  const tiles = [
    {
      key: 'OUT_OF_STOCK',
      count: inventory.outOfStock,
      to: '/products?health=OUT_OF_STOCK',
      className: 'text-destructive',
    },
    {
      key: 'CRITICAL',
      count: inventory.critical,
      to: '/products?health=CRITICAL',
      className: 'text-destructive',
    },
    {
      key: 'LOW_STOCK',
      count: inventory.lowStock,
      to: '/products?health=LOW_STOCK',
      className: 'text-warning',
    },
    {
      key: 'HIGH_RETURNS',
      count: inventory.highReturns,
      to: '/products?health=HIGH_RETURNS',
      className: 'text-warning',
    },
    {
      key: 'SLOW_MOVING',
      count: inventory.slowMoving,
      to: '/products?health=SLOW_MOVING',
      className: 'text-muted-foreground',
    },
    {
      key: 'NO_SALES',
      count: inventory.noSales,
      to: '/products?health=NO_SALES',
      className: 'text-muted-foreground',
    },
  ];

  return (
    <Panel title={t('inventory.title')} className={cn('space-y-4', className)}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Link
            key={tile.key}
            to={tile.to}
            className="bg-muted/50 hover:bg-muted/80 flex flex-col gap-0.5 rounded-lg p-3 transition-colors">
            <span className={cn('font-mono text-xl font-bold', tile.className)}>{tile.count}</span>
            <span className="text-muted-foreground text-[11px] leading-tight">
              {t(`health.${tile.key}`, { ns: 'products' })}
            </span>
          </Link>
        ))}
      </div>

      <div className="border-border grid gap-3 border-t pt-3 sm:grid-cols-2">
        <div>
          <p className="text-muted-foreground text-xs">{t('inventory.stockValue')}</p>
          <p className="font-mono text-sm font-semibold">{fmtTJS(inventory.stockValue)}</p>
        </div>
        <div>
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <PackageX className="h-3 w-3" />
            {t('inventory.frozenValue')}
          </p>
          <p
            className={cn(
              'font-mono text-sm font-semibold',
              inventory.slowMovingValue > 0 && 'text-warning'
            )}>
            {fmtTJS(inventory.slowMovingValue)}
          </p>
        </div>
      </div>
    </Panel>
  );
}
