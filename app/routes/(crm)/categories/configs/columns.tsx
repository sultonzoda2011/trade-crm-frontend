import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { UserAvatar } from '~/components/shared/UserAvatar';
import { IconActionButton, RowActionsCell } from '~/components/shared/RowActionsCell';
import { Badge } from '~/components/ui/badge';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { formatDate } from '~/lib/format';
import type { Category, CategoryDetail } from '~/types/products';
import { useCategoriesModals } from '~/routes/(crm)/categories/store';

function CategoriesActionsCell({ row, t }: { row: Category; t: TFunction }) {
  const deleteModal = useCategoriesModals((s) => s.delete);
  const editModal = useCategoriesModals((s) => s.edit);
  const location = useLocation();
  const { can } = useCan();

  return (
    <RowActionsCell>
      <IconActionButton
        icon={<Eye className="h-4 w-4" />}
        label={t('actions.view')}
        render={<Link to={`/categories/${row.id}`} state={{ fromPath: location.pathname, fromName: t('title') }} />}
      />
      {can(Action.CATEGORIES_MANAGE) && (
        <IconActionButton
          icon={<Pencil className="h-4 w-4" />}
          label={t('actions.edit')}
          onClick={() => editModal.open(row as unknown as CategoryDetail)}
        />
      )}
      {can(Action.CATEGORIES_MANAGE) && (
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

const columnHelper = createColumnHelper<Category>();

export const getColumns = ({ t }: { t: TFunction }): ColumnDef<Category, any>[] => {
  return [
    columnHelper.accessor('name', {
      header: t('fields.name'),
      enableHiding: false,
      cell: (info) => <UserAvatar fullName={info.row.original.name} imagePath={info.row.original.image ?? undefined} />,
    }),
    columnHelper.accessor('description', {
      header: t('fields.description'),
      cell: (info) => <div className="text-muted-foreground w-50 truncate text-sm">{info.getValue() ?? '—'}</div>,
    }),
    columnHelper.accessor('_count.products', {
      id: '_count.products',
      header: t('fields.productsCount'),
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
      cell: (info) => <CategoriesActionsCell row={info.row.original} t={t} />,
    }),
  ] as ColumnDef<Category, any>[];
};
