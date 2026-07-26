import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { UserAvatar } from '~/components/shared/UserAvatar';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { formatDate, fmtTJS } from '~/lib/format';
import type { Product } from '~/types/products';
import { useProductsModals } from '../store';

function ProductActionsCell({ row, t }: { row: Product; t: TFunction }) {
  const deleteModal = useProductsModals((s) => s.delete);
  const location = useLocation();
  const { can } = useCan();

  return (
    <div className="flex justify-end gap-1">
      <Tooltip>
        <TooltipTrigger render={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            render={<Link to={`/products/${row.id}`} state={{ fromPath: location.pathname, fromName: t('title') }} />}>
            <Eye className="h-4 w-4" />
          </Button>
        } />
        <TooltipContent side="bottom">{t('actions.view')}</TooltipContent>
      </Tooltip>
      {can(Action.PRODUCTS_EDIT) && (
        <Tooltip>
          <TooltipTrigger render={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              render={<Link to={`/products/${row.id}/edit`} state={{ fromPath: location.pathname, fromName: t('title') }} />}>
              <Pencil className="h-4 w-4" />
            </Button>
          } />
          <TooltipContent side="bottom">{t('actions.edit')}</TooltipContent>
        </Tooltip>
      )}
      {can(Action.PRODUCTS_DELETE) && (
        <Tooltip>
          <TooltipTrigger render={
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8"
              onClick={() => deleteModal.open(row.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          } />
          <TooltipContent side="bottom">{t('actions.delete')}</TooltipContent>
        </Tooltip>
      )}
    </div>
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
            {product.quantity} {t(`unit.${product.unit}`, { defaultValue: product.unit })}
          </Badge>
        );
      },
    }),
    columnHelper.accessor('category.name', {
      header: t('fields.category'),
      cell: (info) => {
        const name = info.getValue();
        return name ? <span className="text-sm">{name}</span> : <span className="text-muted-foreground text-sm">—</span>;
      },
    }),
    columnHelper.accessor('market.name', {
      header: t('fields.market'),
      cell: (info) => <span className="text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor('_count.transactionItems', {
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
