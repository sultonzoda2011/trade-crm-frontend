import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { Banknote } from 'lucide-react';
import { EntityActionsCell } from '~/components/shared/EntityActionsCell';
import { PendingBadge, PendingEffectsNote } from '~/components/shared/PendingBadge';
import { PendingRowActions } from '~/components/shared/PendingRowActions';
import { IconActionButton } from '~/components/shared/RowActionsCell';
import { UserAvatar } from '~/components/shared/UserAvatar';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { useOpenPay } from '~/hooks/useOpenPay';
import { fmtTJS, formatDate } from '~/lib/format';
import { useDebtorsModals } from '~/routes/(crm)/debtors/store';
import type { DebtorRow } from '~/types/pending';

function DebtorActionsCell({ row, t }: { row: DebtorRow; t: TFunction }) {
  const deleteModal = useDebtorsModals((s) => s.delete);
  const { can } = useCan();

  const { mutate: openPay, isPending: isPayLoading } = useOpenPay(t('actions.payLoadError', { ns: 'debtors' }));

  // Должник ещё не создан на сервере: просмотр, правка и оплата для него бессмысленны — только повторить или убрать.
  if (row.pending) return <PendingRowActions pending={row.pending} />;

  return (
    <EntityActionsCell
      id={row.id}
      basePath="/debtors"
      t={t}
      editAction={Action.DEBTORS_EDIT}
      deleteAction={Action.DEBTORS_DELETE}
      onDelete={deleteModal.open}
      leadingActions={
        row.activeDebtTransactionId && can(Action.TRANSACTIONS_EDIT) ? (
          <IconActionButton
            icon={<Banknote className="size-4" />}
            label={t('actions.pay', { ns: 'debtors' })}
            loading={isPayLoading}
            onClick={() => row.activeDebtTransactionId && openPay(row.activeDebtTransactionId)}
          />
        ) : null
      }
    />
  );
}

const columnHelper = createColumnHelper<DebtorRow>();

export const getColumns = ({ t }: { t: TFunction }): ColumnDef<DebtorRow, any>[] => {
  return [
    columnHelper.accessor('name', {
      header: t('fields.name'),
      enableHiding: false,
      cell: (info) => {
        const { name, phone, pending } = info.row.original;
        return (
          <div className="flex items-center gap-2">
            <UserAvatar fullName={name} subInfo={phone} />
            {pending && <PendingBadge pending={pending} />}
          </div>
        );
      },
    }),

    columnHelper.accessor((row: any) => row.totalDebtAmount ?? 0, {
      id: 'totalDebtAmount',
      header: t('totalDebtAmount'),
      cell: (info) => (
        <div className="flex flex-col items-start gap-0.5">
          <span className="font-mono text-sm">{fmtTJS(info.getValue())}</span>
          <PendingEffectsNote effects={info.row.original.pendingOps} />
        </div>
      ),
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
  ] as ColumnDef<DebtorRow, any>[];
};
