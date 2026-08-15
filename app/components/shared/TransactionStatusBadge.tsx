import type { TFunction } from 'i18next';
import { Badge } from '~/components/ui/badge';
import { TRANSACTION_STATUS_BADGE } from '~/config/transactionBadges';
import type { TransactionStatus } from '~/types/transactions';
import { cn } from '~/lib/utils';

export function TransactionStatusBadge({ status, t }: { status: TransactionStatus; t: TFunction }) {
  return (
    <Badge variant="outline" className={cn('text-xs font-normal', TRANSACTION_STATUS_BADGE[status])}>
      {t(`status.${status}`, { ns: 'transactions' })}
    </Badge>
  );
}
