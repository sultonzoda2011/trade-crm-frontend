import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { EntityActionsCell } from '~/components/shared/EntityActionsCell';
import { UserAvatar } from '~/components/shared/UserAvatar';
import { Badge } from '~/components/ui/badge';
import { Action } from '~/config/actions';
import { formatDate } from '~/lib/format';
import { useCategoriesModals } from '~/routes/(crm)/categories/store';
import type { Category } from '~/types/products';

function CategoriesActionsCell({ row, t }: { row: Category; t: TFunction }) {
  const deleteModal = useCategoriesModals((s) => s.delete);
  return (
    <EntityActionsCell
      id={row.id}
      basePath="/categories"
      t={t}
      editAction={Action.CATEGORIES_MANAGE}
      deleteAction={Action.CATEGORIES_MANAGE}
      onDelete={deleteModal.open}
    />
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
      cell: (info) => <div className="text-muted-foreground text-sm">{info.getValue() ?? '—'}</div>,
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
