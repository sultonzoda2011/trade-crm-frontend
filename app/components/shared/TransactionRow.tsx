import type { ComponentProps, ReactNode } from 'react';
import type { TFunction } from 'i18next';
import { ListLink } from '~/components/shared/ListLink';
import { TransactionStatusBadge } from '~/components/shared/TransactionStatusBadge';
import { fmtTJS, formatDate } from '~/lib/format';
import type { Transaction } from '~/types/transactions';

interface TransactionRowProps extends ComponentProps<typeof ListLink> {
  tx: Transaction;
  t: TFunction;
  subtitle?: ReactNode;
  showDebtor?: boolean;
}

export function TransactionRow({ tx, t, subtitle, showDebtor = true, ...linkProps }: TransactionRowProps) {
  const defaultSubtitle = showDebtor && tx.debtor ? `${tx.debtor.name} · ${formatDate(tx.createdAt, true)}` : formatDate(tx.createdAt, true);

  return (
    <ListLink {...linkProps} className="py-3">
      <div className="min-w-0">
        <p className="flex items-center gap-2 truncate text-sm font-medium">
          #{tx.id.slice(0, 8)}
          <TransactionStatusBadge status={tx.status} t={t} />
        </p>
        <p className="text-muted-foreground text-xs">{subtitle ?? defaultSubtitle}</p>
      </div>
      <div className="text-right">
        <p className="font-mono text-sm font-semibold">{fmtTJS(tx.totalAmount)}</p>
        {tx.remainingAmount > 0 && (
          <p className="text-warning font-mono text-xs">
            {t('remaining', { ns: 'transactions', defaultValue: 'Остаток' })}: {fmtTJS(tx.remainingAmount)}
          </p>
        )}
      </div>
    </ListLink>
  );
}