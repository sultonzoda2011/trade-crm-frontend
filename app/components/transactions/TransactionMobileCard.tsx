import type { Row } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { RotateCcw, ShoppingBag } from 'lucide-react';
import { InitialAvatar } from '~/components/shared/InitialAvatar';
import { PendingBadge, PendingEffectsNote } from '~/components/shared/PendingBadge';
import { TransactionStateBadge } from '~/components/transactions/TransactionStateBadge';
import { getTransactionTitle } from '~/components/transactions/TransactionProducts';
import { formatDateShort, formatTime } from '~/lib/format';
import { signedAmount } from '~/lib/transaction-view';
import { cn } from '~/lib/utils';
import type { TransactionRow } from '~/types/pending';

interface TransactionMobileCardProps {
  row: Row<TransactionRow>;
  t: TFunction;
  actionsCell?: React.ReactNode;
  /** Дату пишем в строке только когда список не разбит по дням (сортировка по сумме). */
  showDate?: boolean;
}

const AMOUNT_TONE = {
  income: 'text-success',
  expense: 'text-destructive',
  neutral: 'text-foreground',
} as const;

/**
 * Строка транзакции. Структура всегда одна и та же:
 *   имя клиента (или «Розничная продажа») → товары → время · способ оплаты,
 * справа сумма со знаком и состояние капсулой.
 */
export function TransactionMobileCard({ row, t, actionsCell, showDate = false }: TransactionMobileCardProps) {
  const tx = row.original;
  const title = getTransactionTitle(tx, t, { retail: true });
  const first = tx.items[0];
  const more = tx.items.length - 1;
  const amount = signedAmount(tx);
  // Продажа, которую целиком вернули, деньгами уже не является — зачёркиваем сумму.
  const fullyRefunded = tx.type === 'SALE' && tx.status === 'REFUNDED';

  // Способ оплаты есть смысл показывать у продажи; у долга вместо него — слово «В долг».
  const method = tx.type === 'SALE' ? t(`paymentType.${tx.paymentType}`) : tx.type === 'DEBT' ? t('type.DEBT') : '';
  const when = showDate ? `${formatDateShort(tx.createdAt)} ${formatTime(tx.createdAt)}` : formatTime(tx.createdAt);

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      {tx.debtor ? (
        <InitialAvatar name={tx.debtor.name} />
      ) : (
        <span
          aria-hidden
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-full',
            tx.type === 'REFUND' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
          )}>
          {tx.type === 'REFUND' ? <RotateCcw className="size-5" /> : <ShoppingBag className="size-5" />}
        </span>
      )}

      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="line-clamp-2 text-base leading-snug font-semibold">{title}</p>
        {first && (
          <p className="text-muted-foreground flex min-w-0 items-baseline gap-1.5 text-sm leading-snug">
            <span className="truncate">
              {first.productName} × {first.quantity}
            </span>
            {more > 0 && <span className="shrink-0 whitespace-nowrap">{t('list.moreItems', { count: more })}</span>}
          </p>
        )}
        <p className="text-muted-foreground text-xs leading-snug">{[when, method].filter(Boolean).join(' · ')}</p>
        {tx.pending && <PendingBadge pending={tx.pending} className="mt-1" />}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
        <p
          className={cn(
            'font-mono text-base leading-snug font-semibold tabular-nums',
            fullyRefunded ? 'text-muted-foreground line-through' : AMOUNT_TONE[amount.tone]
          )}>
          {amount.text}
        </p>
        <TransactionStateBadge tx={tx} t={t} />
        <PendingEffectsNote effects={tx.pendingOps} className="justify-end" />
      </div>
      {actionsCell && <div className="relative z-2 -mr-1.5 shrink-0">{actionsCell}</div>}
    </div>
  );
}
