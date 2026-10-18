import { useQueryClient } from '@tanstack/react-query';
import { Banknote, HandCoins, RotateCw, ShoppingCart, Trash2, Undo2, UserPlus, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '~/components/shared/ConfirmDialog';
import { ListEmpty, ListGroup } from '~/components/shared/ListGroup';
import { Button } from '~/components/ui/button';
import { useNetworkStatus } from '~/hooks/useNetworkStatus';
import { useOfflineQueue } from '~/hooks/useOfflineQueue';
import { fmtTJS } from '~/lib/format';
import {
  canRemove,
  canRetry,
  removeQueueItem,
  retryAllFailed,
  retryQueueItem,
  sendQueueNow,
  type QueueItem,
} from '~/lib/offline-queue';
import { cn } from '~/lib/utils';

function iconFor(item: QueueItem): LucideIcon {
  if (item.kind === 'debtor') return UserPlus;
  if (item.kind === 'pay') return Banknote;
  if (item.kind === 'refund') return Undo2;
  return item.transactionType === 'DEBT' ? HandCoins : ShoppingCart;
}

/** Очередь неотправленных операций: что ждёт сети, что отправляется, что упало и ждёт решения. */
export function QueueSection() {
  const { t, i18n } = useTranslation('sync');
  const queryClient = useQueryClient();
  const isOnline = useNetworkStatus();
  const { items, pending, failed } = useOfflineQueue();
  const [removing, setRemoving] = useState<QueueItem | null>(null);

  const title = (item: QueueItem): string => {
    const kind = t(`queue.kind.${item.kind}`);
    if (item.kind === 'debtor') return item.debtorName ? `${kind} · ${item.debtorName}` : kind;
    if (item.kind === 'create') {
      const type = item.transactionType ? t(`queue.type.${item.transactionType}`) : kind;
      return item.itemsCount ? `${type} · ${t('queue.items', { count: item.itemsCount })}` : type;
    }
    if (item.kind === 'pay') return item.amount !== undefined ? `${kind} · ${fmtTJS(item.amount)}` : kind;
    return `${kind} · ${item.itemsCount ? t('queue.items', { count: item.itemsCount }) : t('queue.refundAll')}`;
  };

  const statusText = (item: QueueItem): string =>
    item.status === 'retrying'
      ? t('queue.status.retrying', { count: item.attempts + 1 })
      : t(`queue.status.${item.status}`);

  const time = (ts: number) =>
    new Intl.DateTimeFormat(i18n.language, { hour: '2-digit', minute: '2-digit' }).format(new Date(ts));

  let action: React.ReactNode;
  if (failed > 0) {
    action = (
      <button type="button" className="text-primary -my-2 min-h-11" onClick={() => retryAllFailed(queryClient)}>
        {t('queue.retryAll')}
      </button>
    );
  } else if (pending > 0 && isOnline) {
    action = (
      <button type="button" className="text-primary -my-2 min-h-11" onClick={() => sendQueueNow(queryClient)}>
        {t('queue.sendNow')}
      </button>
    );
  }

  return (
    <>
      <ListGroup
        title={items.length > 0 ? `${t('queue.title')} · ${items.length}` : t('queue.title')}
        action={action}
        footer={t('queue.footer')}>
        {items.length === 0 ? (
          <ListEmpty>{t('queue.empty')}</ListEmpty>
        ) : (
          items.map((item) => {
            const Icon = iconFor(item);
            return (
              <div key={item.id} className="flex min-h-14 items-center gap-3 px-4 py-2.5">
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full',
                    item.status === 'failed'
                      ? 'bg-destructive/12 text-destructive'
                      : item.status === 'waiting'
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-primary/12 text-primary'
                  )}>
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-base leading-snug">{title(item)}</p>
                  <p className="text-muted-foreground text-sm leading-snug">
                    {statusText(item)} · {t('queue.queuedAt', { time: time(item.queuedAt) })}
                  </p>
                  {item.status === 'failed' && item.error && (
                    <p className="text-destructive mt-0.5 text-sm leading-snug break-words">{item.error.message}</p>
                  )}
                </div>
                {canRetry(item) && (
                  <Button
                    variant="secondary"
                    size="icon"
                    aria-label={t('queue.retry')}
                    onClick={() => retryQueueItem(queryClient, item.id)}>
                    <RotateCw />
                  </Button>
                )}
                {canRemove(item) && (
                  <Button variant="ghost" size="icon" aria-label={t('queue.remove')} onClick={() => setRemoving(item)}>
                    <Trash2 />
                  </Button>
                )}
              </div>
            );
          })
        )}
      </ListGroup>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        onConfirm={() => {
          if (removing) removeQueueItem(queryClient, removing.id);
          setRemoving(null);
        }}
        type="danger"
        title={t('queue.removeTitle')}
        description={removing?.error?.transient ? t('queue.removeMaybeSent') : t('queue.removeDescription')}
        confirmText={t('queue.remove')}
      />
    </>
  );
}
