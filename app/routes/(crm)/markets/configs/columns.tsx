import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { UserAvatar } from '~/components/shared/UserAvatar';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { ROLE_CONFIG } from '~/config/enumOptions';
import { useCan } from '~/hooks/useCan';
import { formatDate } from '~/lib/format';
import type { Market } from '~/types/markets';
import { useMarketsModals } from '../store';

function MarketActionsCell({ row, t }: { row: Market; t: TFunction }) {
  const deleteModal = useMarketsModals((s) => s.delete);
  const editModal = useMarketsModals((s) => s.edit);
  const location = useLocation();
  const { can } = useCan();

  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        render={<Link to={`/markets/${row.id}`} state={{ fromPath: location.pathname, fromName: t('title') }} />}
        title={t('actions.view')}>
        <Eye className="h-4 w-4" />
      </Button>
      {can(Action.MARKETS_EDIT) && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title={t('actions.edit')}
          onClick={() => editModal.open(row)}>
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      {can(Action.MARKETS_DELETE) && (
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

const columnHelper = createColumnHelper<Market>();

export const getColumns = ({ t }: { t: TFunction }): ColumnDef<Market, any>[] => {
  return [
    columnHelper.accessor('name', {
      header: t('fields.name'),
      enableHiding: false,
      cell: (info) => (
        <UserAvatar
          fullName={info.row.original.name}
          imagePath={info.row.original.image ?? undefined}
          subInfo={info.row.original.address}
        />
      ),
    }),
    columnHelper.accessor('address', {
      header: t('fields.address'),
      cell: (info) => <span className="text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor('owner.name', {
      header: t('fields.owner', 'Владелец'),
      cell: (info) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{info.getValue()}</span>
          <span className="text-muted-foreground text-2xs">{info.row.original.owner.email}</span>
        </div>
      ),
    }),

    columnHelper.accessor('count.products', {
      header: t('fields.products', 'Товары'),
      cell: (info) => (
        <Badge variant="secondary" className="font-mono">
          {info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor('count.debtors', {
      header: t('fields.debtors', 'Должники'),
      cell: (info) => (
        <Badge variant="secondary" className="font-mono">
          {info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor('count.transactions', {
      header: t('fields.transactions', 'Транзакции'),
      cell: (info) => (
        <Badge variant="secondary" className="font-mono">
          {info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: t('fields.createdAt', 'Дата создания'),
      cell: (info) => <span className="text-sm">{formatDate(info.getValue())}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      enableHiding: false,
      header: () => <div className="text-center">{t('fields.actions')}</div>,
      cell: (info) => <MarketActionsCell row={info.row.original} t={t} />,
    }),
  ] as ColumnDef<Market, any>[];
};
