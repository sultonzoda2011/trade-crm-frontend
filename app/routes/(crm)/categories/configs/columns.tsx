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
import { formatDate } from '~/lib/format';
import type { Category, CategoryDetail } from '~/types/products';
import { useCategoriesModals } from '../store';

function CategoriesActionsCell({ row, t }: { row: Category; t: TFunction }) {
  const deleteModal = useCategoriesModals((s) => s.delete);
  const editModal = useCategoriesModals((s) => s.edit);
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
            render={<Link to={`/categories/${row.id}`} state={{ fromPath: location.pathname, fromName: t('title') }} />}>
            <Eye className="h-4 w-4" />
          </Button>
        } />
        <TooltipContent side="bottom">{t('actions.view')}</TooltipContent>
      </Tooltip>
      {can(Action.CATEGORIES_MANAGE) && (
        <Tooltip>
          <TooltipTrigger render={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => editModal.open(row as unknown as CategoryDetail)}>
              <Pencil className="h-4 w-4" />
            </Button>
          } />
          <TooltipContent side="bottom">{t('actions.edit')}</TooltipContent>
        </Tooltip>
      )}
      {can(Action.CATEGORIES_MANAGE) && (
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
      cell: (info) => (
        <div className="w-[180px] truncate text-sm text-muted-foreground">
          {info.getValue() ?? '—'}
        </div>
      ),
    }),
    columnHelper.accessor('_count.products', {
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
