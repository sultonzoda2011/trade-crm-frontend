import { ArrowUpRight, Banknote, HandCoins, ShoppingCart, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ListGroup } from '~/components/shared/ListGroup';
import { fmtTJS, formatDate } from '~/lib/format';
import { cn } from '~/lib/utils';
import type { TimelineEventType, TransactionTimelineEvent } from '~/types/transactions';

const EVENT_STYLE: Record<TimelineEventType, { icon: typeof ShoppingCart; dot: string; amount: string }> = {
  SALE: { icon: ShoppingCart, dot: 'bg-primary/15 text-primary', amount: 'text-foreground' },
  DEBT: { icon: HandCoins, dot: 'bg-warning/15 text-warning', amount: 'text-foreground' },
  PAYMENT: { icon: Banknote, dot: 'bg-success/15 text-success', amount: 'text-success' },
  REFUND: { icon: Undo2, dot: 'bg-destructive/15 text-destructive', amount: 'text-destructive' },
};

interface TransactionTimelineProps {
  events: TransactionTimelineEvent[];
  /** Events pointing elsewhere become links; the current transaction does not. */
  currentId: string;
}

/**
 * Sale → payments → refunds on one axis, oldest first.
 *
 * The point is that a transaction is a process, not a row: the owner can read
 * what happened and in what order without cross-referencing three tables.
 */
export function TransactionTimeline({ events, currentId }: TransactionTimelineProps) {
  const { t } = useTranslation(['transactions', 'common']);

  if (events.length === 0) return null;

  return (
    <ListGroup title={t('detail.timeline')}>
      <ol className="px-4 py-3">
        {events.map((event, index) => {
          const style = EVENT_STYLE[event.type];
          const Icon = style.icon;
          const isOther = event.transactionId !== currentId;
          const isLast = index === events.length - 1;

          return (
            <li key={`${event.transactionId}-${event.type}-${event.at}-${index}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', style.dot)}>
                  <Icon className="size-4" />
                </span>
                {!isLast && <span className="bg-border my-1 w-px flex-1" />}
              </div>
              <div className={cn('flex flex-1 items-start justify-between gap-3', !isLast && 'pb-3')}>
                <div className="min-w-0">
                  <p className="text-base leading-8 font-medium">{t(`detail.timelineEvent.${event.type}`)}</p>
                  <p className="text-muted-foreground -mt-1 text-sm">
                    {formatDate(event.at, true)} ·{' '}
                    {event.actor ? t('detail.actor', { name: event.actor }) : t('detail.actorUnknown')}
                  </p>
                  {isOther && (
                    <Link
                      to={`/transactions/${event.transactionId}`}
                      className="text-primary mt-0.5 inline-flex items-center gap-1 text-sm hover:underline">
                      {t('detail.openTransaction')}
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  )}
                </div>
                <span className={cn('shrink-0 font-mono text-base leading-8 font-semibold', style.amount)}>
                  {event.type === 'REFUND' ? '−' : ''}
                  {fmtTJS(event.amount)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </ListGroup>
  );
}
