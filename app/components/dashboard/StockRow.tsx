import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Badge } from '~/components/ui/badge';
import { REORDER_PRIORITY_BADGE } from '~/config/analyticsBadges';
import { STOCK_ANALYSIS_DAYS } from '~/config/dashboard';
import { cn } from '~/lib/utils';
import type { ReorderProduct } from '~/types/dashboard';

/** The three states that put a product on the "order" list, in the owner's words. */
const STATUS_KEY = {
  OUT_OF_STOCK: 'stock.status.OUT_OF_STOCK',
  CRITICAL: 'stock.status.CRITICAL',
  WARNING: 'stock.status.WARNING',
} as const;

/** 1,5 / 12 / 0,3 — one decimal at most; this is a pace, not an accounting figure. */
const rate = (value: number) => (Math.round(value * 10) / 10).toLocaleString('ru-RU');

interface StockRowProps {
  product: ReorderProduct;
  /**
   * The Inventory tab has room to show how the advice was reached: the pace of
   * sales and what an order would cover. The Overview keeps the short row.
   */
  detailed?: boolean;
}

/**
 * One product that should be bought, with the reasoning next to the advice.
 *
 * The explanation is built only from what was measured: how much sold in the
 * window, the pace that implies, and the minimum the owner set by hand. Nothing
 * is added from outside the response — "an order covers N days" is derived from
 * the quantity and the pace the backend returned, not from a rule copied here.
 */
export function StockRow({ product, detailed = false }: StockRowProps) {
  const { t } = useTranslation(['dashboard', 'products']);
  const { metrics } = product;

  const unit = t(`unit.${product.unit}`, { ns: 'products', defaultValue: '' });
  const priority = metrics.reorderPriority;
  const statusKey = priority in STATUS_KEY ? STATUS_KEY[priority as keyof typeof STATUS_KEY] : null;

  const reasons: string[] = [];
  if (product.quantity <= 0) {
    reasons.push(t('stock.reason.soldOut', { days: STOCK_ANALYSIS_DAYS, sold: metrics.netUnitsSold, unit }));
  } else if (metrics.daysOfStockRemaining === null) {
    reasons.push(t('stock.reason.noSales', { days: STOCK_ANALYSIS_DAYS }));
  } else if (metrics.daysOfStockRemaining < 1) {
    reasons.push(t('stock.reason.lessThanDay'));
  } else {
    reasons.push(t('stock.reason.daysLeft', { count: Math.round(metrics.daysOfStockRemaining) }));
  }
  if (product.quantity > 0 && product.lowStockThreshold > 0 && product.quantity <= product.lowStockThreshold) {
    reasons.push(t('stock.reason.belowMinimum', { min: product.lowStockThreshold, unit }));
  }

  // Detail line: how fast it sells, and how long an order would last at that pace.
  const perDay = metrics.avgDailySales;
  const details: string[] = [];
  if (detailed && perDay > 0) {
    details.push(
      perDay >= 1
        ? t('stock.pace.perDay', { rate: rate(perDay), unit })
        : t('stock.pace.perWeek', { rate: rate(perDay * 7), unit })
    );
    if (metrics.recommendedQuantity > 0) {
      details.push(
        t('stock.afterOrder', { days: Math.max(Math.round((product.quantity + metrics.recommendedQuantity) / perDay), 1) })
      );
    }
  }

  return (
    <Link
      to={`/products/${product.id}`}
      className="active:bg-muted/70 flex min-h-16 items-start gap-3 px-4 py-3 transition-colors">
      <span className="min-w-0 flex-1">
        <span className="block text-base leading-snug font-semibold break-words">{product.name}</span>

        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          {statusKey && (
            <Badge variant="outline" className={cn('text-xs', REORDER_PRIORITY_BADGE[priority])}>
              {t(statusKey)}
            </Badge>
          )}
          <span className="text-muted-foreground text-sm">{t('stock.left', { quantity: product.quantity, unit })}</span>
        </span>

        <span className="text-muted-foreground mt-1 block text-sm leading-snug">{reasons.join(' ')}</span>
        {details.map((line) => (
          <span key={line} className="text-muted-foreground mt-0.5 block text-sm leading-snug">
            {line}
          </span>
        ))}
      </span>

      <span className="shrink-0 text-right">
        <span className="text-muted-foreground block text-xs leading-tight">{t('stock.order')}</span>
        <span className="block font-mono text-base leading-snug font-semibold tabular-nums">
          {t('stock.orderAmount', { quantity: metrics.recommendedQuantity, unit })}
        </span>
      </span>

      <ChevronRight className="text-muted-foreground/60 mt-1 -mr-1 size-4 shrink-0" />
    </Link>
  );
}
