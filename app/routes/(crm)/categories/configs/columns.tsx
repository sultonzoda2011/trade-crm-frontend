import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { CategoryTile } from '~/components/categories/CategoryTile';
import { EntityActionsCell } from '~/components/shared/EntityActionsCell';
import { Badge } from '~/components/ui/badge';
import { Action } from '~/config/actions';
import { formatDate, fmtNum } from '~/lib/format';
import { useCategoriesModals } from '~/routes/(crm)/categories/store';
import type { Category } from '~/types/products';

function CategoriesActionsCell({ row, t }: { row: Category; t: TFunction }) {
  const removeModal = useCategoriesModals((s) => s.remove);
  return (
    <EntityActionsCell
      id={row.id}
      basePath="/categories"
      t={t}
      editAction={Action.CATEGORIES_MANAGE}
      deleteAction={Action.CATEGORIES_MANAGE}
      onDelete={() =>
        removeModal.open({ id: row.id, name: row.name, productsCount: row._count.products + (row.archivedCount ?? 0) })
      }
    />
  );
}

const columnHelper = createColumnHelper<Category>();

export const getColumns = ({ t }: { t: TFunction }): ColumnDef<Category, any>[] => {
  return [
    columnHelper.accessor('name', {
      header: t('fields.name'),
      enableHiding: false,
      cell: (info) => (
        <div className="flex items-center gap-3">
          <CategoryTile image={info.row.original.image} color={info.row.original.color} size="sm" />
          <span className="font-medium">{info.getValue()}</span>
        </div>
      ),
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
    // Сумма остатка — только владельцу/админу: у продавца поля нет в ответе.
    columnHelper.accessor('stockValue', {
      header: t('fields.stockValue'),
      cell: (info) =>
        info.getValue() === undefined ? null : <span className="font-mono text-sm">{fmtNum(info.getValue())}</span>,
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
