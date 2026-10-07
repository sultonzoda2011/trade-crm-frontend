import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { ListGroup } from '~/components/shared/ListGroup';
import { getTransactionTitle } from '~/components/transactions/TransactionProducts';
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

  const rowClass = 'flex min-h-12 items-center justify-between gap-3 px-4 py-2.5 transition-colors active:bg-muted/70';

  return (
    <ListGroup
      title={refundOf ? t('detail.originalSale') : `${t('detail.refundHistory')} · ${refunds.length}`}
      footer={refundOf ? t('detail.refundOfHint') : undefined}>
      {refundOf ? (
        <Link to={`/transactions/${refundOf.id}`} state={linkState} className={rowClass}>
          <span className="min-w-0">
            <span className="block text-base leading-snug">{formatDate(refundOf.createdAt, true)}</span>
            <span className="text-primary inline-flex items-center gap-1 text-sm">
              {t('detail.openTransaction')}
              <ArrowUpRight className="size-3.5" />
            </span>
          </span>
          <span className="shrink-0 font-mono text-base font-semibold">{fmtTJS(refundOf.totalAmount)}</span>
        </Link>
      ) : (
        refunds.map((refund) => (
          <Link key={refund.id} to={`/transactions/${refund.id}`} state={linkState} className={rowClass}>
            <span className="min-w-0">
              <span className="block text-base leading-snug font-medium">{getTransactionTitle(refund, t)}</span>
              <span className="text-muted-foreground block text-sm leading-snug">
                {formatDate(refund.createdAt, true)}
                {refund.createdBy ? ` · ${t('detail.actor', { name: refund.createdBy.name })}` : ''}
              </span>
              {refund.items && refund.items.length > 0 && (
                <span className="text-muted-foreground block text-sm leading-snug break-words">
                  {refund.items.map((item) => `${item.productName} × ${item.quantity}`).join(', ')}
                </span>
              )}
            </span>
            <span className="text-destructive shrink-0 font-mono text-base font-semibold">
              −{fmtTJS(refund.totalAmount)}
            </span>
          </Link>
        ))
      )}
    </ListGroup>
  );
}
