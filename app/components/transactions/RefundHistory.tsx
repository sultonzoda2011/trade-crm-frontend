import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { Panel } from '~/components/layout/Panel';
import { getTransactionTitle } from '~/components/transactions/TransactionProducts';
import { Badge } from '~/components/ui/badge';
import { fmtTJS, formatDate } from '~/lib/format';
import type { RelatedTransaction } from '~/types/transactions';

interface RefundHistoryProps {
  /** Set when this transaction is itself a refund of an earlier sale. */
  refundOf: RelatedTransaction | null;
  /** Refunds issued against this transaction, oldest first. */
  refunds: RelatedTransaction[];
}

/**
 * The refund side of a sale, kept inside the transaction domain.
 *
 * A refund is not a standalone record the user has to go hunting for: from any
 * sale you can see what came back, and from any refund you can jump to the sale
 * it reverses. Without this link the money in the Dashboard and the money in
 * the list would look like they disagree.
 */
export function RefundHistory({ refundOf, refunds }: RefundHistoryProps) {
  const { t } = useTranslation('transactions');
  const location = useLocation();
  const linkState = { fromPath: location.pathname, fromName: t('title') };

  if (!refundOf && refunds.length === 0) return null;

  return (
    <Panel
      title={refundOf ? t('detail.originalSale') : t('detail.refundHistory')}
      actions={
        refunds.length > 0 ? (
          <Badge variant="secondary" className="text-xs font-normal">
            {refunds.length}
          </Badge>
        ) : undefined
      }>
      {refundOf ? (
        <div className="flex items-center justify-between gap-3 py-1">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs">{t('detail.refundOfHint')}</p>
            <p className="text-2xs text-muted-foreground">{formatDate(refundOf.createdAt, true)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="font-mono text-sm font-semibold">{fmtTJS(refundOf.totalAmount)}</span>
            <Link
              to={`/transactions/${refundOf.id}`}
              state={linkState}
              className="text-primary inline-flex items-center gap-1 text-xs hover:underline">
              {t('detail.openTransaction')}
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <ul className="divide-y">
          {refunds.map((refund) => (
            <li key={refund.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">{getTransactionTitle(refund, t)}</p>
                <p className="text-muted-foreground text-2xs">
                  {formatDate(refund.createdAt, true)}
                  {refund.createdBy ? ` · ${t('detail.actor', { name: refund.createdBy.name })}` : ''}
                </p>
                {refund.items && refund.items.length > 0 && (
                  <p className="text-muted-foreground truncate text-xs">
                    {refund.items.map((item) => `${item.productName} × ${item.quantity}`).join(', ')}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-destructive font-mono text-sm font-semibold">
                  −{fmtTJS(refund.totalAmount)}
                </span>
                <Link
                  to={`/transactions/${refund.id}`}
                  state={linkState}
                  className="text-primary inline-flex items-center gap-1 text-xs hover:underline">
                  {t('detail.openTransaction')}
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
