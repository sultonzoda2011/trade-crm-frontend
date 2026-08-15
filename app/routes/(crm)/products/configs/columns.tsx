import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { UserAvatar } from '~/components/shared/UserAvatar';
import { IconActionButton, RowActionsCell } from '~/components/shared/RowActionsCell';
import { Badge } from '~/components/ui/badge';
import { Action } from '~/config/actions';
import { PRODUCT_HEALTH_BADGE, REORDER_PRIORITY_BADGE } from '~/config/analyticsBadges';
import { useCan } from '~/hooks/useCan';
import { formatDate, fmtTJS } from '~/lib/format';
import type { Product } from '~/types/products';
import { useProductsModals } from '~/routes/(crm)/products/store';

function ProductActionsCell({ row, t }: { row: Product; t: TFunction }) {
  const deleteModal = useProductsModals((s) => s.delete);
  const location = useLocation();
  const { can } = useCan();

  return (
    <RowActionsCell>
      <IconActionButton
        icon={<Eye className="h-4 w-4" />}
        label={t('actions.view')}
        render={<Link to={`/products/${row.id}`} state={{ fromPath: location.pathname, fromName: t('title') }} />}
      />
      {can(Action.PRODUCTS_EDIT) && (
        <IconActionButton
          icon={<Pencil className="h-4 w-4" />}
          label={t('actions.edit')}
          render={
            <Link to={`/products/${row.id}/edit`} state={{ fromPath: location.pathname, fromName: t('title') }} />
          }
        />
      )}
      {can(Action.PRODUCTS_DELETE) && (
        <IconActionButton
          icon={<Trash2 className="h-4 w-4" />}
          label={t('actions.delete')}
          danger
          onClick={() => deleteModal.open(row.id)}
        />
      )}
    </RowActionsCell>
  );
}

const columnHelper = createColumnHelper<Product>();

export const getColumns = ({ t }: { t: TFunction }): ColumnDef<Product, any>[] => {
  return [
    columnHelper.accessor('name', {
      header: t('fields.name'),
      enableHiding: false,
      cell: (info) => (
        <UserAvatar
          fullName={info.row.original.name}
          imagePath={info.row.original.image ?? undefined}
          subInfo={info.row.original.market?.name}
        />
      ),
    }),
    columnHelper.accessor('price', {
      header: t('fields.price'),
      cell: (info) => <span className="font-mono text-sm font-medium">{fmtTJS(info.getValue())}</span>,
    }),
    columnHelper.accessor('quantity', {
      header: t('fields.quantity'),
      cell: (info) => {
        const product = info.row.original;
        const isLow = product.quantity <= product.lowStockThreshold;
        return (
          <Badge variant={isLow ? 'destructive' : 'secondary'} className="font-mono">
            {product.quantity} {t(`unit.${product.unit}`)}
          </Badge>
        );
      },
    }),
    // Вычисленное бэкендом состояние. Один столбец вместо трёх сырых чисел:
    // владельцу нужен ответ «что с товаром», а не таблица из 30 колонок.
    columnHelper.accessor((row) => row.metrics?.health, {
      id: 'metrics.health',
      header: t('filters.health'),
      cell: (info) => {
        const health = info.row.original.metrics?.health;
        if (!health) return <span className="text-muted-foreground text-sm">—</span>;
        return (
          <Badge variant="outline" className={PRODUCT_HEALTH_BADGE[health]}>
            {t(`health.${health}`)}
          </Badge>
        );
      },
    }),
    columnHelper.accessor((row) => row.metrics?.reorderPriority, {
      id: 'metrics.reorderPriority',
      header: t('filters.reorderPriority'),
      cell: (info) => {
        const priority = info.row.original.metrics?.reorderPriority;
        if (!priority) return <span className="text-muted-foreground text-sm">—</span>;
        const recommended = info.row.original.metrics?.recommendedQuantity ?? 0;
        return (
          <span className="flex items-center gap-2">
            <Badge variant="outline" className={REORDER_PRIORITY_BADGE[priority]}>
              {t(`reorderPriority.${priority}`)}
            </Badge>
            {recommended > 0 && <span className="text-muted-foreground font-mono text-xs">+{recommended}</span>}
          </span>
        );
      },
    }),
    
    columnHelper.accessor((row) => row.metrics?.daysOfStockRemaining, {
      id: 'metrics.daysOfStockRemaining',
      header: t('metrics.daysOfStock'),
      cell: (info) => {
        const days = info.getValue();
        if (days == null)
          return <span className="text-muted-foreground text-xs">{t('metrics.noVelocity')}</span>;
        return <span className="font-mono text-sm">{t('metrics.daysUnit', { count: days })}</span>;
      },
    }),
    columnHelper.accessor((row) => row.metrics?.netUnitsSold, {
      id: 'metrics.netUnitsSold',
      header: t('metrics.netUnitsSold'),
      cell: (info) => {
        const metrics = info.row.original.metrics;
        return (
          <span className="flex items-baseline gap-1.5">
            <span className="font-mono text-sm">{info.getValue() ?? 0}</span>
            {metrics?.refundedUnits ? (
              <span className="text-destructive font-mono text-xs">−{metrics.refundedUnits}</span>
            ) : null}
          </span>
        );
      },
    }),
    columnHelper.accessor((row) => row.metrics?.revenue, {
      id: 'metrics.revenue',
      header: t('metrics.revenue'),
      cell: (info) => <span className="font-mono text-sm">{fmtTJS(info.getValue() ?? 0)}</span>,
    }),
    columnHelper.accessor('category.name', {
      id: 'category.name',
      header: t('fields.category'),
      cell: (info) => {
        const name = info.getValue();
        return name ? (
          <span className="text-sm">{name}</span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
    }),
    columnHelper.accessor('market.name', {
      id: 'market.name',
      header: t('fields.market'),
      cell: (info) => <span className="text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor('_count.transactionItems', {
      id: '_count.transactionItems',
      header: t('fields.transactionItems'),
      cell: (info) => (
        <Badge variant="secondary" className="font-mono">
          {info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: t('fields.createdAt'),
      cell: (info) => <span className="text-sm">{formatDate(info.getValue())}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      enableHiding: false,
      header: () => <div className="text-center">{t('fields.actions')}</div>,
      cell: (info) => <ProductActionsCell row={info.row.original} t={t} />,
    }),
  ] as ColumnDef<Product, any>[];
};
