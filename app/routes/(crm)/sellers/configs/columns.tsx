import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { UserAvatar } from '~/components/shared/UserAvatar';
import { IconActionButton, RowActionsCell } from '~/components/shared/RowActionsCell';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import type { Seller } from '~/types/sellers';
import { useSellersModals } from '~/routes/(crm)/sellers/store';

function SellerActionsCell({ row, t }: { row: Seller; t: TFunction }) {
  const deleteModal = useSellersModals((s) => s.delete);
  const editModal = useSellersModals((s) => s.edit);
  const location = useLocation();
  const { can } = useCan();

  return (
    <RowActionsCell>
      <IconActionButton
        icon={<Eye className="h-4 w-4" />}
        label={t('actions.view')}
        render={<Link to={`/sellers/${row.id}`} state={{ fromPath: location.pathname, fromName: t('title') }} />}
      />
      {can(Action.SELLERS_EDIT) && (
        <IconActionButton
          icon={<Pencil className="h-4 w-4" />}
          label={t('actions.edit')}
          onClick={() => editModal.open(row)}
        />
      )}
      {can(Action.SELLERS_DELETE) && (
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
      id: 'market.name',
      header: t('fields.market'),
      cell: (info) => {
        const market = info.row.original.market;
        return (
          <UserAvatar
            fullName={market?.name ?? ''}
            subInfo={market?.address ?? ''}
            imagePath={market?.image ?? undefined}
          />
        );
      },
    }),

    columnHelper.display({
      id: 'actions',
      enableHiding: false,
      header: () => <div className="text-center">{t('fields.actions')}</div>,
      cell: (info) => <SellerActionsCell row={info.row.original} t={t} />,
    }),
  ] as ColumnDef<Seller, any>[];
};
