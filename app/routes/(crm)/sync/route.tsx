import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { AlertCircle, ChevronRight, CloudUpload, RefreshCw, X } from 'lucide-react';
import { Panel } from '~/components/layout/Panel';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { useOnlineStatus } from '~/hooks/useOnlineStatus';
import { useSyncStore } from '~/store/useSyncStore';
import { SYNC_ENTITIES } from '~/lib/offline/entities';
import { getLastSyncedAt } from '~/lib/offline/syncMeta';
import type { QueuedMutation } from '~/lib/offline/queue';

const KIND_LABEL_KEY: Record<QueuedMutation['kind'], string> = {
  'transaction:create': 'queue.transactionCreate',
  'transaction:pay': 'queue.transactionPay',
  'transaction:refund': 'queue.transactionRefund',
};

export default function SyncPage() {
  const { t, i18n } = useTranslation(['sync', 'common']);
  const online = useOnlineStatus();
  const { outbox, isSyncing, lastSyncAt, lastError, refreshOutbox, runPush, cancelItem } = useSyncStore();
  const [entityLastSync, setEntityLastSync] = useState<Record<string, string | null>>({});

  useEffect(() => {
    refreshOutbox();
  }, [refreshOutbox]);

  useEffect(() => {
    Promise.all(SYNC_ENTITIES.map((e) => getLastSyncedAt(e.key, 'list'))).then((values) => {
      setEntityLastSync(Object.fromEntries(SYNC_ENTITIES.map((e, i) => [e.key, values[i]])));
    });
  }, []);

  const handlePush = async () => {
    await runPush();
  };

  const handleCancel = async (item: QueuedMutation) => {
    if (!window.confirm(t('confirmRemoveQueueItem'))) return;
    await cancelItem(item);
  };

  const offlineReason = t('offlineTooltip');

  return (
    <div className="space-y-4">
      <BreadCrumbs items={[{ label: t('title') }]} />

      <Panel
        title={t('outgoingTitle')}
        actions={
          !online ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <span>
                    <Button variant="outline" size="sm" disabled>
                      <CloudUpload className="mr-1.5 h-4 w-4" />
                      {t('pushButton')} {outbox.length > 0 ? `(${outbox.length})` : ''}
                    </Button>
                  </span>
                }
              />
              <TooltipContent side="top">{offlineReason}</TooltipContent>
            </Tooltip>
          ) : (
            <Button variant="outline" size="sm" disabled={isSyncing || outbox.length === 0} onClick={handlePush}>
              <CloudUpload className="mr-1.5 h-4 w-4" />
              {t('pushButton')} {outbox.length > 0 ? `(${outbox.length})` : ''}
            </Button>
          )
        }>
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
          <Badge variant={online ? 'secondary' : 'destructive'}>{online ? t('online') : t('offline')}</Badge>
          {lastSyncAt && <span>{t('lastSync', { date: new Date(lastSyncAt).toLocaleString(i18n.language) })}</span>}
          {isSyncing && (
            <span className="flex items-center gap-1">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> {t('syncing')}
            </span>
          )}
        </div>
        {!online && <p className="text-warning mt-2 text-sm font-medium">{offlineReason}</p>}
        <p className="text-muted-foreground mt-1 text-sm">{t('pushDescription')}</p>

        {lastError && (
          <div className="border-destructive/30 bg-destructive/10 text-destructive mt-3 flex items-start gap-2 rounded-lg border p-3 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{lastError}</span>
          </div>
        )}
      </Panel>

      <Panel title={t('queueTitle', { count: outbox.length })} bodyClassName="p-0">
        {outbox.length === 0 ? (
          <div className="text-muted-foreground p-6 text-center text-sm">{t('queueEmpty')}</div>
        ) : (
          <ul className="divide-border divide-y">
            {outbox.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t(KIND_LABEL_KEY[item.kind] ?? item.kind)}</span>
                    {item.status === 'failed' && (
                      <Badge variant="destructive" className="text-xs">
                        {t('queueFailed')}
                      </Badge>
                    )}
                  </div>
                  <div className="text-muted-foreground mt-0.5 text-xs">
                    {new Date(item.createdAt).toLocaleString(i18n.language)}
                  </div>
                  {item.error && <div className="text-destructive mt-1 text-xs break-words">{item.error}</div>}
                </div>
                {item.status === 'failed' && (
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleCancel(item)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title={t('referenceDataTitle')} bodyClassName="p-0">
        <ul className="divide-border divide-y">
          {SYNC_ENTITIES.map((entity) => (
            <li key={entity.key}>
              <Link
                to={`/sync/${entity.key}`}
                className="hover:bg-muted/50 flex items-center justify-between gap-3 px-4 py-3 transition-colors">
                <div>
                  <div className="font-medium">{t(entity.labelKey)}</div>
                  <div className="text-muted-foreground text-xs">
                    {entityLastSync[entity.key]
                      ? t('lastSync', { date: new Date(entityLastSync[entity.key]!).toLocaleString(i18n.language) })
                      : t('neverSynced')}
                  </div>
                </div>
                <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
