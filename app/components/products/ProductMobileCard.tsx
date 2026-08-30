import type { Row } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { AlertTriangle, Package, ShoppingCart } from 'lucide-react';
import { EntityMobileCard } from '~/components/shared/EntityMobileCard';
import { PRODUCT_HEALTH_BADGE, REORDER_PRIORITY_BADGE } from '~/config/analyticsBadges';
import { fmtTJS } from '~/lib/format';
import type { Product } from '~/types/products';

interface ProductMobileCardProps {
  row: Row<Product>;
  t: TFunction;
  actionsCell?: React.ReactNode;
}

export function ProductMobileCard({ row, t, actionsCell }: ProductMobileCardProps) {
  const product = row.original;
  const isLow = product.quantity <= product.lowStockThreshold;
  const health = product.metrics?.health;
  const priority = product.metrics?.reorderPriority;
  const recommended = product.metrics?.recommendedQuantity ?? 0;
  const days = product.metrics?.daysOfStockRemaining;

  return (
    <EntityMobileCard
      image={product.image}
      fallbackIcon={Package}
      title={product.name}
      subtitle={product.market?.name}
      actionsCell={actionsCell}
      badges={[
        ...(health ? [{ label: t(`health.${health}`), className: PRODUCT_HEALTH_BADGE[health] }] : []),
        ...(priority
          ? [
              {
                label: `${t(`reorderPriority.${priority}`)}${recommended > 0 ? ` +${recommended}` : ''}`,
                className: REORDER_PRIORITY_BADGE[priority],
              },
            ]
          : []),
      ]}
      stats={[
        { icon: ShoppingCart, label: t('fields.price'), value: fmtTJS(product.price) },
        {
          icon: AlertTriangle,
          label: t('fields.quantity'),
          value: `${product.quantity} ${t(`unit.${product.unit}`)}`,
          valueClassName: isLow ? 'text-destructive' : undefined,
        },
        ...(days != null ? [{ label: t('metrics.daysOfStockRemaining', 'Запас, дней'), value: String(days) }] : []),
      ]}
    />
  );
}
