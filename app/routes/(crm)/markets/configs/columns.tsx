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
import type { Market } from '~/types/markets';
import { useMarketsModals } from '~/routes/(crm)/markets/store';

function MarketActionsCell({ row, t }: { row: Market; t: TFunction }) {
  const deleteModal = useMarketsModals((s) => s.delete);
  const editModal = useMarketsModals((s) => s.edit);
  const location = useLocation();
  const { can } = useCan();

  return (
    <RowActionsCell>
      <IconActionButton
        icon={<Eye className="h-4 w-4" />}
        label={t('actions.view')}
        render={<Link to={`/markets/${row.id}`} state={{ fromPath: location.pathname, fromName: t('title') }} />}
      />
      {can(Action.MARKETS_EDIT) && (
        <IconActionButton
          icon={<Pencil className="h-4 w-4" />}
          label={t('actions.edit')}
          onClick={() => editModal.open(row)}
        />
      )}
      {can(Action.MARKETS_DELETE) && (
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
    columnHelper.accessor('owner.name', {
      id: 'owner.name',
      header: t('fields.owner', 'Владелец'),
      cell: (info) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{info.getValue()}</span>
          <span className="text-muted-foreground text-2xs">{info.row.original.owner.email}</span>
        </div>
      ),
    }),

    columnHelper.accessor('count.products', {
      id: 'count.products',
      header: t('fields.products', 'Товары'),
      cell: (info) => (
        <Badge variant="secondary" className="font-mono">
          {info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor('count.debtors', {
      id: 'count.debtors',
      header: t('fields.debtors', 'Должники'),
      cell: (info) => (
        <Badge variant="secondary" className="font-mono">
          {info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor('count.transactions', {
      id: 'count.transactions',
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
