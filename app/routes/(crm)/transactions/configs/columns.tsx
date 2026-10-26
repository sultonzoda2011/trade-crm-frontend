import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { CreditCard } from 'lucide-react';
import { Link } from 'react-router';
import { EntityActionsCell } from '~/components/shared/EntityActionsCell';
import { PendingBadge, PendingEffectsNote } from '~/components/shared/PendingBadge';
import { PendingRowActions } from '~/components/shared/PendingRowActions';
import { IconActionButton } from '~/components/shared/RowActionsCell';
import { TransactionProducts } from '~/components/transactions/TransactionProducts';
import { Badge } from '~/components/ui/badge';
import { Action } from '~/config/actions';
import { TRANSACTION_STATUS_BADGE, TRANSACTION_TYPE_BADGE } from '~/config/transactionBadges';
import { useCan } from '~/hooks/useCan';
import { isClientId } from '~/lib/client-ids';
import { fmtTJS, formatDate } from '~/lib/format';
import { useTransactionsModals } from '~/routes/(crm)/transactions/store';
import type { TransactionRow } from '~/types/pending';
import type { TransactionStatus, TransactionType } from '~/types/transactions';

function TransactionActionsCell({ row, t }: { row: TransactionRow; t: TFunction }) {
  const deleteModal = useTransactionsModals((s) => s.delete);
  const payModal = useTransactionsModals((s) => s.pay);
  const { can } = useCan();

  // Продажи ещё нет на сервере: открыть, оплатить или удалить её нельзя — только повторить или убрать из очереди.
  if (row.pending) return <PendingRowActions pending={row.pending} />;

  return (
    <EntityActionsCell
      id={row.id}
      basePath="/transactions"
      t={t}
      deleteAction={Action.TRANSACTIONS_DELETE}
      onDelete={deleteModal.open}
      leadingActions={
        can(Action.TRANSACTIONS_EDIT) ? (
          <IconActionButton
            icon={<CreditCard className="size-3.5" />}
            label={t('pay')}
            outline
            disabled={row.remainingAmount <= 0}
            onClick={() => payModal.open(row)}
          />
        ) : null
      }
    />
  );
}

const columnHelper = createColumnHelper<TransactionRow>();

export const getColumns = ({ t }: { t: TFunction }): ColumnDef<TransactionRow, any>[] => {
  return [
    columnHelper.display({
      id: 'products',
      header: t('fields.items'),
      enableHiding: false,
      cell: (info) => {
        const tx = info.row.original;
        const content =
          tx.items && tx.items.length > 0 ? (
            <TransactionProducts items={tx.items} size="sm" max={3} />
          ) : (
            <span className="text-muted-foreground text-xs">{t(`type.${tx.type}`)}</span>
          );
        // У продажи из очереди страницы ещё нет — вместо ссылки метка её состояния.
        if (tx.pending) {
          return (
            <div className="inline-flex items-center gap-2">
              {content}
              <PendingBadge pending={tx.pending} />
            </div>
          );
        }
        return (
          <Link
            to={`/transactions/${tx.id}`}
            className="inline-flex items-center gap-2 transition-opacity hover:opacity-80">
            {content}
          </Link>
        );
      },
    }),

    columnHelper.accessor('debtor', {
      header: t('fields.debtor'),
      cell: (info) => {
        const debtor = info.getValue();
        if (!debtor) return null;
        // Должник из очереди (временный id) ещё не имеет страницы.
        return isClientId(debtor.id) ? (
          <span className="text-sm font-medium">{debtor.name}</span>
        ) : (
          <Link to={`/debtors/${debtor.id}`} className="text-sm font-medium hover:underline">
            {debtor.name}
          </Link>
        );
      },
    }),
    columnHelper.accessor('customerName', {
      header: t('fields.customer'),
      cell: (info) => {
        return <span>{info.getValue()}</span>;
      },
    }),
    columnHelper.accessor('type', {
      header: t('fields.type'),
      cell: (info) => {
        const type = info.getValue() as TransactionType;
        const label = t(`type.${type}`);
        return (
          <Badge variant="outline" className={TRANSACTION_TYPE_BADGE[type]}>
            {label}
          </Badge>
        );
      },
    }),
    columnHelper.accessor('paymentType', {
      header: t('fields.paymentType'),
      cell: (info) => {
        const pType = info.getValue();
        return (
          <Badge variant="secondary" className="font-normal">
            {t(`paymentType.${pType}`)}
          </Badge>
        );
      },
    }),
    columnHelper.accessor('totalAmount', {
      header: t('fields.totalAmount'),
      cell: (info) => <span className="font-mono text-sm font-semibold">{fmtTJS(info.getValue())}</span>,
    }),
    columnHelper.accessor('remainingAmount', {
      header: t('fields.remainingAmount'),
      cell: (info) => {
        const remaining = info.getValue();
        return (
          <div className="flex flex-col items-start gap-0.5">
            <span className={`font-mono text-sm font-medium ${remaining > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
              {fmtTJS(remaining)}
            </span>
            <PendingEffectsNote effects={info.row.original.pendingOps} />
          </div>
        );
      },
    }),
    columnHelper.accessor('status', {
      header: t('fields.status'),
      cell: (info) => {
        const status = info.getValue() as TransactionStatus;
        return (
          <Badge variant="outline" className={`font-medium ${TRANSACTION_STATUS_BADGE[status]}`}>
            {t(`status.${status}`)}
          </Badge>
        );
      },
    }),
    columnHelper.accessor('createdAt', {
      header: t('fields.createdAt'),
      cell: (info) => <span className="text-muted-foreground text-xs">{formatDate(info.getValue(), true)}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      enableHiding: false,
      header: () => <div className="text-center">{t('fields.actions', { ns: 'common' })}</div>,
      cell: (info) => <TransactionActionsCell row={info.row.original} t={t} />,
    }),
  ] as ColumnDef<TransactionRow, any>[];
};
