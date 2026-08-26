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
          className="h-8 px-2 text-xs sm:px-3"
          render={<Link to="/products?needsReorder=true" />}>
          {t('viewAll')}
        </Button>
      }>
      {products.length === 0 ? (
        <div className="flex min-h-24 items-center justify-center px-4 py-6">
          <p className="text-muted-foreground text-center text-sm">{t('reorder.empty')}</p>
        </div>
      ) : (
        <div className="divide-border divide-y">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className={cn(
                'hover:bg-muted/40',
                'flex min-w-0 items-center gap-3 px-3 py-3 sm:px-4',
                'transition-colors',
                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none'
              )}>
              {/* Product information */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{product.name}</p>

                <p className="text-muted-foreground mt-0.5 truncate text-xs">
                  {product.metrics.daysOfStockRemaining === null
                    ? t('reorder.noVelocity')
                    : t('reorder.daysLeft', {
                        days: product.metrics.daysOfStockRemaining,
                      })}

                  {' · '}

                  {t('reorder.inStock', {
                    count: product.quantity,
                  })}
                </p>
              </div>

              {/* Reorder information */}
              <div className="flex shrink-0 items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'max-w-24 truncate sm:max-w-none',
                    REORDER_PRIORITY_BADGE[product.metrics.reorderPriority]
                  )}>
                  {t(`reorderPriority.${product.metrics.reorderPriority}`, { ns: 'products' })}
                </Badge>

                <span className="min-w-8 text-right font-mono text-sm font-semibold">
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
    <Panel title={t('inventory.title')} className={cn('space-y-4 sm:space-y-5', className)}>
      {/* Health metrics */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
        {tiles.map((tile) => (
          <Link
            key={tile.key}
            to={tile.to}
            className={cn(
              'bg-muted/50 hover:bg-muted/80',
              'flex min-w-0 flex-col justify-center',
              'rounded-lg p-3 sm:p-3.5',
              'transition-colors',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none'
            )}>
            <span className={cn('font-mono text-lg font-bold sm:text-xl', tile.className)}>{tile.count}</span>

            <span className="text-muted-foreground text-2xs mt-0.5 line-clamp-2 leading-snug sm:text-xs">
              {t(`health.${tile.key}`, {
                ns: 'products',
              })}
            </span>
          </Link>
        ))}
      </div>

      {/* Inventory values */}
      <div className="border-border grid grid-cols-1 gap-3 border-t pt-3 sm:grid-cols-2 sm:gap-4">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs sm:text-sm">{t('inventory.stockValue')}</p>

          <p className="mt-0.5 truncate font-mono text-lg font-semibold sm:text-xl">{fmtTJS(inventory.stockValue)}</p>
        </div>

        <div className="min-w-0 sm:text-right">
          <p className="text-muted-foreground text-xs sm:text-sm">{t('inventory.frozenValue')}</p>

          <p
            className={cn(
              'mt-0.5 truncate font-mono text-lg font-semibold sm:text-xl',
              inventory.slowMovingValue > 0 && 'text-warning'
            )}>
            {fmtTJS(inventory.slowMovingValue)}
          </p>
        </div>
      </div>
    </Panel>
  );
}
