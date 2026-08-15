import { Banknote, HandCoins, ShoppingCart, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Panel } from '~/components/layout/Panel';
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
    <Panel title={t('detail.timeline')}>
      <ol className="space-y-3">
        {events.map((event, index) => {
          const style = EVENT_STYLE[event.type];
          const Icon = style.icon;
          const isOther = event.transactionId !== currentId;

          return (
            <li key={`${event.transactionId}-${event.type}-${event.at}-${index}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-full', style.dot)}>
                  <Icon className="size-3.5" />
                </span>
                {index < events.length - 1 && <span className="bg-border mt-1 w-px flex-1" />}
              </div>
              <div className="flex flex-1 items-start justify-between gap-3 pb-1">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{t(`detail.timelineEvent.${event.type}`)}</p>
                  <p className="text-muted-foreground text-2xs">
                    {formatDate(event.at, true)} ·{' '}
                    {event.actor ? t('detail.actor', { name: event.actor }) : t('detail.actorUnknown')}
                  </p>
                  {isOther && (
                    <Link
                      to={`/transactions/${event.transactionId}`}
                      className="text-primary text-xs hover:underline">
                      #{event.transactionId.slice(0, 8)}
                    </Link>
                  )}
                </div>
                <span className={cn('shrink-0 font-mono text-sm font-semibold', style.amount)}>
                  {event.type === 'REFUND' ? '−' : ''}
                  {fmtTJS(event.amount)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
