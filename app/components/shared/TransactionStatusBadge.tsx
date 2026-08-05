import type { TFunction } from 'i18next';
import { Badge } from '~/components/ui/badge';
import type { TransactionStatus } from '~/types/transactions';
import { cn } from '~/lib/utils';

const STATUS_CLASSES: Record<TransactionStatus, string> = {
  PAID: 'border-success/40 bg-success/15 text-success',
  REFUNDED: 'border-destructive/40 bg-destructive/15 text-destructive',
  PARTIAL: 'border-sky-500/30 bg-sky-500/15 text-sky-500',
  ACTIVE: 'border-warning/40 bg-warning/15 text-warning',
};

export function TransactionStatusBadge({ status, t }: { status: TransactionStatus; t: TFunction }) {
  return (
    <Badge variant="outline" className={cn('text-xs font-normal', STATUS_CLASSES[status])}>
      {t(`status.${status}`, { ns: 'transactions', defaultValue: status })}
    </Badge>
  );
}