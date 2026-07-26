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
import { Role } from '~/types/common';
import type { Seller } from '~/types/sellers';
import { useSellersModals } from '../store';

function SellerActionsCell({ row, t }: { row: Seller; t: TFunction }) {
  const deleteModal = useSellersModals((s) => s.delete);
  const editModal = useSellersModals((s) => s.edit);
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
            render={<Link to={`/sellers/${row.id}`} state={{ fromPath: location.pathname, fromName: t('title') }} />}>
            <Eye className="h-4 w-4" />
          </Button>
        } />
        <TooltipContent side="bottom">{t('actions.view')}</TooltipContent>
      </Tooltip>
      {can(Action.SELLERS_EDIT) && (
        <Tooltip>
          <TooltipTrigger render={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => editModal.open(row)}>
              <Pencil className="h-4 w-4" />
            </Button>
          } />
          <TooltipContent side="bottom">{t('actions.edit')}</TooltipContent>
        </Tooltip>
      )}
      {can(Action.SELLERS_DELETE) && (
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

const columnHelper = createColumnHelper<Seller>();

export const getColumns = ({ t }: { t: TFunction }): ColumnDef<Seller, any>[] => {
  return [
    columnHelper.accessor('name', {
      header: t('fields.name'),
      enableHiding: false,
      cell: (info) => <UserAvatar fullName={info.row.original.name} imagePath={info.row.original.image ?? undefined} />,
    }),
    columnHelper.accessor('email', {
      header: t('fields.email'),
      cell: (info) => <span className="text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor('market.name', {
      header: t('fields.name'),
      enableHiding: false,
      cell: (info) => <span className="text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor('market.address', {
      header: () => <span>{t('fields.marketAddress')}</span>,
      enableHiding: false,
      cell: (info) => <span className="text-sm">{info.getValue()}</span>,
    }),

    columnHelper.display({
      id: 'actions',
      enableHiding: false,
      header: () => <div className="text-center">{t('fields.actions')}</div>,
      cell: (info) => <SellerActionsCell row={info.row.original} t={t} />,
    }),
  ] as ColumnDef<Seller, any>[];
};
