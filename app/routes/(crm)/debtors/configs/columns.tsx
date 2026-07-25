import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { UserAvatar } from '~/components/shared/UserAvatar';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { formatDate } from '~/lib/format';
import type { Debtor } from '~/types/debtors';
import { useDebtorsModals } from '../store';
import { SimpleRiskBadge } from '~/components/dashboard/DebtorRiskBadge';

function DebtorActionsCell({ row, t }: { row: Debtor; t: TFunction }) {
  const deleteModal = useDebtorsModals((s) => s.delete);
  const editModal = useDebtorsModals((s) => s.edit);
  const location = useLocation();
  const { can } = useCan();

  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        render={<Link to={`/debtors/${row.id}`} state={{ fromPath: location.pathname, fromName: t('title') }} />}
        title={t('actions.view')}>
        <Eye className="h-4 w-4" />
      </Button>
      {can(Action.DEBTORS_EDIT) && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title={t('actions.edit')}
          onClick={() => editModal.open(row)}>
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      {can(Action.DEBTORS_DELETE) && (
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

const columnHelper = createColumnHelper<Debtor>();

export const getColumns = ({ t }: { t: TFunction }): ColumnDef<Debtor, any>[] => {
  return [
    columnHelper.accessor('name', {
      header: t('fields.name'),
      enableHiding: false,
      cell: (info) => <UserAvatar fullName={info.row.original.name} />,
    }),
    columnHelper.accessor('phone', {
      header: t('fields.phone'),
      cell: (info) => <span className="text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor('market.name', {
      header: t('fields.market'),
      cell: (info) => <span className="text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor('market.address', {
      header: t('fields.marketAddress'),
      cell: (info) => <span className="text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor('createdAt', {
      header: t('fields.createdAt'),
      cell: (info) => <span className="text-sm">{formatDate(info.getValue())}</span>,
    }),
    columnHelper.accessor('updatedAt', {
      header: t('fields.updatedAt'),
      cell: (info) => <span className="text-sm">{formatDate(info.getValue())}</span>,
    }),
    columnHelper.accessor('_count.transactions', {
      header: t('fields.transactions'),
      cell: (info) => <span className="text-sm">{info.getValue().toLocaleString()}</span>,
    }),
    columnHelper.display({
      id: 'risk',
      header: () => <div>{t('fields.riskLevel', { defaultValue: 'Risk' })}</div>,
      cell: (info) => (
        <SimpleRiskBadge
          totalDebt={info.row.original.totalDebt ?? 0}
          activeTransactions={info.row.original._count?.transactions ?? 0}
        />
      ),
    }),
    columnHelper.display({
      id: 'actions',
      enableHiding: false,
      header: () => <div className="text-center">{t('fields.actions')}</div>,
      cell: (info) => <DebtorActionsCell row={info.row.original} t={t} />,
    }),
  ] as ColumnDef<Debtor, any>[];
};
