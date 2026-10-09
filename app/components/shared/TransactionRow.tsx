import type { TFunction } from 'i18next';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { getTransactionTitle } from '~/components/transactions/TransactionProducts';
import { fmtNum, formatDateShort } from '~/lib/format';
import { cn } from '~/lib/utils';
import type { TransactionListItem } from '~/types/transactions';

interface TransactionRowProps {
  // Самый узкий тип: не используем payments/market.address, поэтому подходит
  // и список (TransactionListItem), и полная Transaction (структурно шире).
  tx: TransactionListItem;
  t: TFunction;
  to: string;
  state?: unknown;
  /** Своя вторая строка вместо «товары · дата». */
  subtitle?: ReactNode;
  showDebtor?: boolean;
  /** Внутри карточки с собственными отступами: строка выравнивается по её контенту (как ListLink). */
  flush?: boolean;
}

/** Компактная строка транзакции (дашборд, страницы должника/продавца/товара). */
export function TransactionRow({ tx, t, to, state, subtitle, showDebtor = true, flush }: TransactionRowProps) {
  const title = getTransactionTitle(tx, t, { skipDebtor: !showDebtor });
  const first = tx.items[0];
  const products = first ? `${first.productName} × ${first.quantity}${tx.items.length > 1 ? ` +${tx.items.length - 1}` : ''}` : '';
  const isDebt = tx.remainingAmount > 0;
  const statusText = isDebt
    ? `${t('remaining', { ns: 'transactions' })} ${fmtNum(tx.remainingAmount)}`
    : t(`status.${tx.status}`, { ns: 'transactions' });
  const statusTone =
    tx.status === 'REFUNDED' ? 'text-destructive' : isDebt || tx.status === 'PARTIALLY_REFUNDED' ? 'text-warning' : 'text-success';

  return (
    <Link
      to={to}
      state={state}
      className={cn(
        'active:bg-muted/70 flex min-h-14 items-center gap-3 py-2.5 transition-colors',
        flush ? '-mx-2 rounded-xl px-2' : 'px-4'
      )}>
      <div className="min-w-0 flex-1">
        <p className="break-words text-base leading-snug font-semibold">{title}</p>
        <p className="text-muted-foreground break-words text-sm leading-snug">
          {subtitle ?? [products, formatDateShort(tx.createdAt)].filter(Boolean).join(' · ')}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-base leading-snug font-semibold">{fmtNum(tx.totalAmount)}</p>
        <p className={cn('text-xs leading-snug font-medium', statusTone)}>{statusText}</p>
      </div>
    </Link>
  );
}
