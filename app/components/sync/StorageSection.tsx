import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ConfirmDialog } from '~/components/shared/ConfirmDialog';
import { ListGroup, ListRow } from '~/components/shared/ListGroup';
import { useStorageStats } from '~/hooks/useStorageStats';
import { fmtNum } from '~/lib/format';
import { clearLastSync } from '~/lib/offline-sync';
import { flushPersistedCache } from '~/lib/query-persister';
import { useSyncStore } from '~/store/useSyncStore';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Сколько места занимает кеш и кнопка «очистить» — очередь неотправленных операций она не трогает. */
export function StorageSection() {
  const { t } = useTranslation('sync');
  const queryClient = useQueryClient();
  const running = useSyncStore((s) => s.running);
  const { stats, refresh } = useStorageStats(running);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const clear = async () => {
    setClearing(true);
    try {
      useSyncStore.getState().reset();
      // reset, а не remove: активные экраны сразу перезапросят своё, если сеть есть.
      await queryClient.resetQueries();
      await flushPersistedCache();
      await clearLastSync();
      await refresh();
      toast.success(t('storage.cleared'));
    } finally {
      setClearing(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <ListGroup title={t('storage.title')}>
        <ListRow title={t('storage.size')} value={stats ? formatBytes(stats.bytes) : '—'} />
        <ListRow title={t('storage.rows')} value={stats ? fmtNum(stats.rows) : '—'} />
        <ListRow title={t('storage.clear')} destructive onClick={() => setConfirmOpen(true)} />
      </ListGroup>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => void clear()}
        type="danger"
        title={t('storage.clearTitle')}
        description={t('storage.clearDescription')}
        confirmText={t('storage.clearAction')}
        isLoading={clearing}
      />
    </>
  );
}
