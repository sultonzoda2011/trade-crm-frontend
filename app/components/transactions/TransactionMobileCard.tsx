import type { Row } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { CreditCard, Receipt, Wallet } from 'lucide-react';
import { EntityMobileCard } from '~/components/shared/EntityMobileCard';
import { TransactionProducts, getTransactionTitle } from '~/components/transactions/TransactionProducts';
import { TRANSACTION_STATUS_BADGE, TRANSACTION_TYPE_BADGE } from '~/config/transactionBadges';
import { fmtTJS, formatDate } from '~/lib/format';
import type { Transaction } from '~/types/transactions';

interface TransactionMobileCardProps {
  row: Row<Transaction>;
  t: TFunction;
  actionsCell?: React.ReactNode;
}

/** Мобильная карточка транзакции — та же система, что и у остальных списков
 * (products/markets/sellers/…), просто без фото (у транзакций его нет). */
export function TransactionMobileCard({ row, t, actionsCell }: TransactionMobileCardProps) {
  const tx = row.original;

  return (
    <EntityMobileCard
      image={null}
      fallbackIcon={Receipt}
      /*
       * Идентифицируем сделку так же, как в TransactionRow: понятная подпись
       * (должник → покупатель → тип) плюс аватарки товаров. Раньше заголовком
       * была сумма, а сумма — это показатель, её место в stats; из шапки было
       * не понять, чья это сделка и что в ней продано.
       */
      title={getTransactionTitle(tx, t)}
      subtitle={formatDate(tx.createdAt, true)}
      media={<TransactionProducts items={tx.items} size="sm" max={3} />}
      actionsCell={actionsCell}
      badges={[
        { label: t(`status.${tx.status}`, { ns: 'transactions' }), className: TRANSACTION_STATUS_BADGE[tx.status] },
        { label: t(`type.${tx.type}`, { ns: 'transactions' }), className: TRANSACTION_TYPE_BADGE[tx.type] },
      ]}
      stats={[
        { icon: Wallet, label: t('fields.totalAmount', { ns: 'transactions' }), value: fmtTJS(tx.totalAmount) },
        {
          icon: CreditCard,
          label: t('fields.paymentType', { ns: 'transactions' }),
          value: t(`paymentType.${tx.paymentType}`, { ns: 'transactions' }),
        },
        ...(tx.remainingAmount > 0
          ? [
              {
                label: t('fields.remainingAmount', { ns: 'transactions' }),
                value: fmtTJS(tx.remainingAmount),
                valueClassName: 'text-warning',
              },
            ]
          : []),
      ]}
    />
  );
}
