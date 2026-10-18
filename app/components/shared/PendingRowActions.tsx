import { useQueryClient } from '@tanstack/react-query';
import { RotateCw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '~/components/shared/ConfirmDialog';
import { IconActionButton, RowActionsCell } from '~/components/shared/RowActionsCell';
import { removeQueueItem, retryQueueItem } from '~/lib/offline-queue';
import type { PendingMeta } from '~/types/pending';

/**
 * Действия над строкой из очереди вместо обычных (просмотр, правка, удаление — для
 * записи, которой ещё нет на сервере, они бессмысленны): повторить упавшую или убрать
 * из очереди. Правила те же, что на экране «Синхронизация» (canRemove/canRetry).
 */
export function PendingRowActions({ pending }: { pending: PendingMeta }) {
  const { t } = useTranslation('sync');
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canRetry = pending.status === 'failed';
  const canRemove = pending.status === 'failed' || (pending.status === 'waiting' && pending.attempts === 0);

  if (!canRetry && !canRemove) return null;

  return (
    <>
      <RowActionsCell>
        {canRetry && (
          <IconActionButton
            icon={<RotateCw className="size-4" />}
            label={t('queue.retry')}
            onClick={() => retryQueueItem(queryClient, pending.mutationId)}
          />
        )}
        {canRemove && (
          <IconActionButton
            icon={<Trash2 className="size-4" />}
            label={t('queue.remove')}
            danger
            onClick={() => setConfirmOpen(true)}
          />
        )}
      </RowActionsCell>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => {
          removeQueueItem(queryClient, pending.mutationId);
          setConfirmOpen(false);
        }}
        type="danger"
        title={t('queue.removeTitle')}
        description={pending.error?.transient ? t('queue.removeMaybeSent') : t('queue.removeDescription')}
        confirmText={t('queue.remove')}
      />
    </>
  );
}
