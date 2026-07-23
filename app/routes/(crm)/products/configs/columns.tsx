import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { UserAvatar } from '~/components/shared/UserAvatar';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { formatDate, fmtTJS } from '~/lib/format';
import type { Product } from '~/types/products';
import { useProductsModals } from '../store';

function ProductActionsCell({ row, t }: { row: Product; t: TFunction }) {
  const deleteModal = useProductsModals((s) => s.delete);
  const editModal = useProductsModals((s) => s.edit);
  const location = useLocation();
  const { can } = useCan();

  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        render={<Link to={`/products/${row.id}`} state={{ fromPath: location.pathname, fromName: t('title') }} />}
        title={t('actions.view')}>
        <Eye className="h-4 w-4" />
      </Button>
      {can(Action.PRODUCTS_EDIT) && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title={t('actions.edit')}
          onClick={() => editModal.open(row)}>
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      {can(Action.PRODUCTS_DELETE) && (
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8"
          title={t('actions.delete')}
          onClick={() => deleteModal.open(row.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
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
      cell: (info) => (
        <Badge variant="secondary" className="font-mono">
          {info.getValue()}
        </Badge>
      ),
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
