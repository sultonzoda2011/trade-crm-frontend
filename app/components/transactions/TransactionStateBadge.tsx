import type { TFunction } from 'i18next';
import { getTransactionBadge, type BadgeTone } from '~/lib/transaction-view';
import { cn } from '~/lib/utils';
import type { TransactionRow } from '~/types/pending';

const TONE_CLASS: Record<BadgeTone, string> = {
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  destructive: 'bg-destructive/15 text-destructive',
  primary: 'bg-primary/15 text-primary',
  muted: 'bg-muted text-muted-foreground',
};

/** Состояние транзакции цветной капсулой: цвет подкреплён текстом, а не заменяет его. */
export function TransactionStateBadge({ tx, t, className }: { tx: TransactionRow; t: TFunction; className?: string }) {
  const { label, tone } = getTransactionBadge(tx, t);
  return (
    <span
      className={cn(
        'inline-flex max-w-full min-w-0 items-center rounded-full px-2.5 py-0.5 text-xs leading-snug font-semibold whitespace-nowrap',
        TONE_CLASS[tone],
        className
      )}>
      <span className="truncate">{label}</span>
    </span>
  );
}
