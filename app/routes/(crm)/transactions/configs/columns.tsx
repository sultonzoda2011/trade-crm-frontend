import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { CreditCard, Eye, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { IconActionButton, RowActionsCell } from '~/components/shared/RowActionsCell';
import { TransactionProducts } from '~/components/transactions/TransactionProducts';
import { Badge } from '~/components/ui/badge';
import { Action } from '~/config/actions';
import { TRANSACTION_STATUS_BADGE, TRANSACTION_TYPE_BADGE } from '~/config/transactionBadges';
import { useCan } from '~/hooks/useCan';
import { fmtTJS, formatDate } from '~/lib/format';
import { useTransactionsModals } from '~/routes/(crm)/transactions/store';
import type { Transaction, TransactionStatus, TransactionType } from '~/types/transactions';

function TransactionActionsCell({ row, t }: { row: Transaction; t: TFunction }) {
  const deleteModal = useTransactionsModals((s) => s.delete);
  const payModal = useTransactionsModals((s) => s.pay);
  const location = useLocation();
  const { can } = useCan();

  return (
    <RowActionsCell>
      {can(Action.TRANSACTIONS_EDIT) && (
        <IconActionButton
          icon={<CreditCard className="h-3.5 w-3.5" />}
          label={t('pay')}
          outline
          disabled={row.remainingAmount <= 0}
          onClick={() => payModal.open(row)}
        />
      )}
      <IconActionButton
        icon={<Eye className="h-4 w-4" />}
        label={t('actions.view', { ns: 'common' })}
        render={<Link to={`/transactions/${row.id}`} state={{ fromPath: location.pathname, fromName: t('title') }} />}
      />
      {can(Action.TRANSACTIONS_DELETE) && (
        <IconActionButton
          icon={<Trash2 className="h-4 w-4" />}
          label={t('actions.delete', { ns: 'common' })}
          danger
          onClick={() => deleteModal.open(row.id)}
        />
      )}
    </RowActionsCell>
  );
}

const columnHelper = createColumnHelper<Transaction>();

export const getColumns = ({ t }: { t: TFunction }): ColumnDef<Transaction, any>[] => {
  return [
    columnHelper.display({
      id: 'products',
      header: t('fields.items'),
      enableHiding: false,
      cell: (info) => {
        const tx = info.row.original;
        return (
          <Link
            to={`/transactions/${tx.id}`}
            className="inline-flex items-center gap-2 transition-opacity hover:opacity-80">
            {tx.items && tx.items.length > 0 ? (
              <TransactionProducts items={tx.items} size="sm" max={3} />
            ) : (
              <span className="text-muted-foreground text-xs">{t(`type.${tx.type}`)}</span>
            )}
          </Link>
        );
      },
    }),

    columnHelper.accessor('debtor', {
      header: t('fields.debtor'),
      cell: (info) => {
        const debtor = info.getValue();
        return (
          debtor && (
            <Link to={`/debtors/${debtor.id}`} className="text-sm font-medium hover:underline">
              {debtor.name}
            </Link>
          )
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
          <span className={`font-mono text-sm font-medium ${remaining > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
            {fmtTJS(remaining)}
          </span>
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
  ] as ColumnDef<Transaction, any>[];
};
