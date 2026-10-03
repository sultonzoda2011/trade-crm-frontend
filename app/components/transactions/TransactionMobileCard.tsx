import type { Row } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { RotateCcw, ShoppingBag } from 'lucide-react';
import { InitialAvatar } from '~/components/shared/InitialAvatar';
import { getTransactionTitle } from '~/components/transactions/TransactionProducts';
import { fmtNum, formatDateShort } from '~/lib/format';
import { cn } from '~/lib/utils';
import type { Transaction } from '~/types/transactions';

interface TransactionMobileCardProps {
  row: Row<Transaction>;
  t: TFunction;
  actionsCell?: React.ReactNode;
}

/** Что показать под суммой: остаток долга важнее слова «Активна» — по нему решают, звонить ли. */
function statusLine(tx: Transaction, t: TFunction): { text: string; className: string } {
  if (tx.status === 'REFUNDED') return { text: t('status.REFUNDED'), className: 'text-destructive' };
  if (tx.status === 'PARTIALLY_REFUNDED') return { text: t('status.PARTIALLY_REFUNDED'), className: 'text-warning' };
  if (tx.remainingAmount > 0)
    return { text: `${t('remaining')} ${fmtNum(tx.remainingAmount)}`, className: 'text-warning' };
  return { text: t('status.PAID'), className: 'text-success' };
}

/**
 * Строка транзакции: кто → что → когда/как, справа сумма и состояние долга.
 * Строка списка, а не карточка: на экран помещается вдвое больше операций.
 */
export function TransactionMobileCard({ row, t, actionsCell }: TransactionMobileCardProps) {
  const tx = row.original;
  const title = getTransactionTitle(tx, t);
  const first = tx.items[0];
  const more = tx.items.length - 1;
  const products = first
    ? `${first.productName} × ${first.quantity}${more > 0 ? ` +${more}` : ''}`
    : '';
  const method = t(`paymentType.${tx.paymentType}`);
  const status = statusLine(tx, t);

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {tx.debtor ? (
        <InitialAvatar name={tx.debtor.name} />
      ) : (
        <span className="bg-muted text-muted-foreground flex size-11 shrink-0 items-center justify-center rounded-full">
          {tx.type === 'REFUND' ? <RotateCcw className="size-5" /> : <ShoppingBag className="size-5" />}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-base leading-snug font-semibold">{title}</p>
        {products && <p className="text-muted-foreground truncate text-sm leading-snug">{products}</p>}
        <p className="text-muted-foreground truncate text-xs leading-snug">
          {formatDateShort(tx.createdAt)}{tx.type === 'SALE' ? ` · ${method}` : ''}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-mono text-base leading-snug font-semibold">{fmtNum(tx.totalAmount)}</p>
        <p className={cn('text-xs leading-snug font-medium', status.className)}>{status.text}</p>
      </div>
      {actionsCell && <div className="relative z-2 -mr-1.5 shrink-0">{actionsCell}</div>}
    </div>
  );
}
