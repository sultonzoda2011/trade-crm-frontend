import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { IconActionButton, RowActionsCell } from '~/components/shared/RowActionsCell';
import { UserAvatar } from '~/components/shared/UserAvatar';
import { Badge } from '~/components/ui/badge';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { getClientUser } from '~/lib/auth-utils';
import { formatDate } from '~/lib/format';
import { useMarketsModals } from '~/routes/(crm)/markets/store';
import type { Market } from '~/types/markets';

function MarketActionsCell({ row, t }: { row: Market; t: TFunction }) {
  const deleteModal = useMarketsModals((s) => s.delete);
  const editModal = useMarketsModals((s) => s.edit);
  const location = useLocation();
  const { can } = useCan();
  // Собственный рынок текущего пользователя (marketId в токене) открываем
  // через /my-market, а не общий /markets/:id — та же карточка, но со своими
  // правами/виджетами, плюс не плодим отдельную страницу для самого себя.
  const isOwnMarket = getClientUser()?.marketId === row.id;

  return (
    <RowActionsCell>
      <IconActionButton
        icon={<Eye className="h-4 w-4" />}
        label={t('actions.view')}
        render={
          <Link
            to={isOwnMarket ? '/my-market' : `/markets/${row.id}`}
            state={isOwnMarket ? undefined : { fromPath: location.pathname, fromName: t('title') }}
          />
        }
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
    columnHelper.accessor('owner.name', {
      id: 'owner.name',
      header: t('fields.owner', 'Владелец'),
      cell: (info) => (
        <UserAvatar
          fullName={info.row.original.owner.name}
          imagePath={info.row.original.owner.image ?? undefined}
          subInfo={info.row.original.owner.email}
        />
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
