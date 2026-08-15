import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { IconActionButton, RowActionsCell } from '~/components/shared/RowActionsCell';
import { UserAvatar } from '~/components/shared/UserAvatar';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { fmtTJS, formatDate } from '~/lib/format';
import { useDebtorsModals } from '~/routes/(crm)/debtors/store';
import type { Debtor } from '~/types/debtors';

function DebtorActionsCell({ row, t }: { row: Debtor; t: TFunction }) {
  const deleteModal = useDebtorsModals((s) => s.delete);
  const editModal = useDebtorsModals((s) => s.edit);
  const location = useLocation();
  const { can } = useCan();

  return (
    <RowActionsCell>
      <IconActionButton
        icon={<Eye className="h-4 w-4" />}
        label={t('actions.view')}
        render={<Link to={`/debtors/${row.id}`} state={{ fromPath: location.pathname, fromName: t('title') }} />}
      />
      {can(Action.DEBTORS_EDIT) && (
        <IconActionButton
          icon={<Pencil className="h-4 w-4" />}
          label={t('actions.edit')}
          onClick={() => editModal.open(row)}
        />
      )}
      {can(Action.DEBTORS_DELETE) && (
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

const columnHelper = createColumnHelper<Debtor>();

export const getColumns = ({ t }: { t: TFunction }): ColumnDef<Debtor, any>[] => {
  return [
    columnHelper.accessor('name', {
      header: t('fields.name'),
      enableHiding: false,
      cell: (info) => <UserAvatar fullName={info.row.original.name} subInfo={info.row.original.phone} />,
    }),

    columnHelper.accessor((row: any) => row.totalDebtAmount ?? 0, {
      id: 'totalDebtAmount',
      header: t('totalDebtAmount'),
      cell: (info) => <span className="font-mono text-sm">{fmtTJS(info.getValue())}</span>,
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
    columnHelper.accessor('_count.transactions', {
      id: '_count.transactions',
      header: t('fields.transactions'),
      cell: (info) => <span className="text-sm">{info.getValue().toLocaleString()}</span>,
    }),
    columnHelper.accessor('createdAt', {
      header: t('fields.createdAt'),
      cell: (info) => <span className="text-sm">{formatDate(info.getValue())}</span>,
    }),
    columnHelper.accessor('updatedAt', {
      header: t('fields.updatedAt'),
      cell: (info) => <span className="text-sm">{formatDate(info.getValue())}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      enableHiding: false,
      header: () => <div className="text-center">{t('fields.actions')}</div>,
      cell: (info) => <DebtorActionsCell row={info.row.original} t={t} />,
    }),
  ] as ColumnDef<Debtor, any>[];
};
