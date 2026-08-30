import { Ban, Boxes, PackageMinus, PackageX, Snowflake, TrendingDown, TriangleAlert, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Panel } from '~/components/layout/Panel';
import { StatCard } from '~/components/shared/StatCard';
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
      className={className}
      bodyClassName="p-0"
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
 *
 * Плитки — общий `StatCard` (`align="start"`): раньше здесь была своя копия
 * того же «иконка + подпись + число», причём без иконок вовсе, а иконка тут
 * несёт смысл — по ней состояние остатка узнаётся быстрее, чем по подписи в
 * две строки.
 */
export function InventoryHealth({ inventory, className }: InventoryHealthProps) {
  const { t } = useTranslation(['dashboard', 'products']);

  const tiles = [
    {
      key: 'OUT_OF_STOCK',
      icon: PackageX,
      count: inventory.outOfStock,
      to: '/products?health=OUT_OF_STOCK',
      valueClassName: 'text-destructive',
      iconClassName: 'bg-destructive/10 text-destructive',
    },
    {
      key: 'CRITICAL',
      icon: TriangleAlert,
      count: inventory.critical,
      to: '/products?health=CRITICAL',
      valueClassName: 'text-destructive',
      iconClassName: 'bg-destructive/10 text-destructive',
    },
    {
      key: 'LOW_STOCK',
      icon: PackageMinus,
      count: inventory.lowStock,
      to: '/products?health=LOW_STOCK',
      valueClassName: 'text-warning',
      iconClassName: 'bg-warning/10 text-warning',
    },
    {
      key: 'HIGH_RETURNS',
      icon: Undo2,
      count: inventory.highReturns,
      to: '/products?health=HIGH_RETURNS',
      valueClassName: 'text-warning',
      iconClassName: 'bg-warning/10 text-warning',
    },
    {
      key: 'SLOW_MOVING',
      icon: TrendingDown,
      count: inventory.slowMoving,
      to: '/products?health=SLOW_MOVING',
      valueClassName: 'text-muted-foreground',
      iconClassName: 'bg-muted text-muted-foreground',
    },
    {
      key: 'NO_SALES',
      icon: Ban,
      count: inventory.noSales,
      to: '/products?health=NO_SALES',
      valueClassName: 'text-muted-foreground',
      iconClassName: 'bg-muted text-muted-foreground',
    },
  ];

  return (
    <Panel title={t('inventory.title')} className={className} bodyClassName="space-y-4 sm:space-y-5">
      {/* Health metrics */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
        {tiles.map((tile) => (
          <StatCard
            key={tile.key}
            align="start"
            size="sm"
            icon={tile.icon}
            label={t(`health.${tile.key}`, { ns: 'products' })}
            value={tile.count}
            to={tile.to}
            valueClassName={tile.valueClassName}
            iconClassName={tile.iconClassName}
          />
        ))}
      </div>

      {/* Inventory values */}
      <div className="border-border grid grid-cols-1 gap-3 border-t pt-3 sm:grid-cols-2 sm:gap-4">
        <StatCard align="start" icon={Boxes} label={t('inventory.stockValue')} value={fmtTJS(inventory.stockValue)} />

        <StatCard
          align="start"
          icon={Snowflake}
          label={t('inventory.frozenValue')}
          value={fmtTJS(inventory.slowMovingValue)}
          valueClassName={cn(inventory.slowMovingValue > 0 && 'text-warning')}
          iconClassName={cn(inventory.slowMovingValue > 0 && 'bg-warning/10 text-warning')}
        />
      </div>
    </Panel>
  );
}
