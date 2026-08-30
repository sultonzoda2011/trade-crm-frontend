import type { TFunction } from 'i18next';
import type { ComponentProps, ReactNode } from 'react';
import { ListLink } from '~/components/shared/ListLink';
import { TransactionStatusBadge } from '~/components/shared/TransactionStatusBadge';
import { TransactionProducts, getTransactionTitle } from '~/components/transactions/TransactionProducts';
import { fmtTJS, formatDate } from '~/lib/format';
import type { Transaction } from '~/types/transactions';

interface TransactionRowProps extends ComponentProps<typeof ListLink> {
  tx: Transaction;
  t: TFunction;
  subtitle?: ReactNode;
  showDebtor?: boolean;
}

export function TransactionRow({ tx, t, subtitle, showDebtor = true, ...linkProps }: TransactionRowProps) {
  // Заголовок вместо #id: должник/покупатель, а товары показываем аватарками
  // рядом. На странице самого должника имя дублировать не нужно — skipDebtor.
  const title = getTransactionTitle(tx, t, { skipDebtor: !showDebtor });
  const defaultSubtitle = formatDate(tx.createdAt, true);

  return (
    <ListLink {...linkProps} className="px-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <TransactionProducts items={tx.items} size="sm" max={3} />
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium">
            <span className="truncate">{title}</span>
            <TransactionStatusBadge status={tx.status} t={t} />
          </p>
          <p className="text-muted-foreground truncate text-xs">{subtitle ?? defaultSubtitle}</p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-sm font-semibold">{fmtTJS(tx.totalAmount)}</p>
        {tx.remainingAmount > 0 && (
          <p className="text-warning font-mono text-xs">
            {t('remaining', { ns: 'transactions' })}: {fmtTJS(tx.remainingAmount)}
          </p>
        )}
      </div>
    </ListLink>
  );
}
