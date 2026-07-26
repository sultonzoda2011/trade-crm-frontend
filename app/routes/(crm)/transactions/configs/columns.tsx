import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { CreditCard, Eye, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { fmtTJS, formatDate } from '~/lib/format';
import type { Transaction } from '~/types/transactions';
import { useTransactionsModals } from '../store';

function TransactionActionsCell({ row, t }: { row: Transaction; t: TFunction }) {
  const deleteModal = useTransactionsModals((s) => s.delete);
  const payModal = useTransactionsModals((s) => s.pay);
  const location = useLocation();
  const { can } = useCan();

  return (
    <div className="flex justify-end gap-1">
      {can(Action.TRANSACTIONS_EDIT) && (
        <Tooltip>
          <TooltipTrigger render={
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => payModal.open(row)} disabled={row.remainingAmount <= 0}>
              <CreditCard className="h-3.5 w-3.5" />
            </Button>
          } />
          <TooltipContent side="bottom">{t('pay')}</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger render={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            render={<Link to={`/transactions/${row.id}`} state={{ fromPath: location.pathname, fromName: t('title') }} />}>
            <Eye className="h-4 w-4" />
          </Button>
        } />
        <TooltipContent side="bottom">{t('actions.view', { ns: 'common' })}</TooltipContent>
      </Tooltip>
      {can(Action.TRANSACTIONS_DELETE) && (
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
          <TooltipContent side="bottom">{t('actions.delete', { ns: 'common' })}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

const columnHelper = createColumnHelper<Transaction>();

export const getColumns = ({ t }: { t: TFunction }): ColumnDef<Transaction, any>[] => {
  return [
    columnHelper.accessor('id', {
      header: t('fields.id'),
      enableHiding: false,
      cell: (info) => (
        <Link
          to={`/transactions/${info.getValue()}`}
          className="text-primary font-mono text-xs font-medium hover:underline">
          #{info.getValue().slice(0, 8)}
        </Link>
      ),
    }),
    columnHelper.accessor('debtor', {
      header: t('fields.debtor'),
      cell: (info) => {
        const debtor = info.getValue();
        return debtor ? (
          <Link to={`/debtors/${debtor.id}`} className="text-sm font-medium hover:underline">
            {debtor.name}
          </Link>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      },
    }),
    columnHelper.accessor('type', {
      header: t('fields.type'),
      cell: (info) => {
        const type = info.getValue();
        const label = t(`type.${type}`, { defaultValue: type });
        let className = 'border-success/40 bg-success/15 text-success font-medium';
        if (type === 'DEBT') className = 'border-warning/40 bg-warning/15 text-warning font-medium';
        if (type === 'REFUND') className = 'border-destructive/40 bg-destructive/15 text-destructive font-medium';
        return (
          <Badge variant="outline" className={className}>
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
            {t(`paymentType.${pType}`, { defaultValue: pType })}
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
          <span
            className={`font-mono text-sm font-medium ${remaining > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
            {fmtTJS(remaining)}
          </span>
        );
      },
    }),
    columnHelper.accessor('status', {
      header: t('fields.status'),
      cell: (info) => {
        const status = info.getValue();
        let className = 'bg-muted text-muted-foreground';
        if (status === 'ACTIVE') className = 'bg-warning/15 text-warning border-warning/30';
        if (status === 'PARTIAL') className = 'bg-sky-500/15 text-sky-500 border-sky-500/30';
        if (status === 'PAID') className = 'bg-success/15 text-success border-success/30';
        if (status === 'REFUNDED') className = 'bg-destructive/15 text-destructive border-destructive/30';

        return (
          <Badge variant="outline" className={`font-medium ${className}`}>
            {t(`status.${status}`, { defaultValue: status })}
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
