import { useEffect } from 'react';
import { AlertCircle, CloudUpload, RefreshCw, X } from 'lucide-react';
import { Panel } from '~/components/layout/Panel';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { useOnlineStatus } from '~/hooks/useOnlineStatus';
import { useSyncStore } from '~/store/useSyncStore';
import type { QueuedMutation } from '~/lib/offline/queue';

const KIND_LABEL: Record<QueuedMutation['kind'], string> = {
  'transaction:create': 'Создание транзакции',
  'transaction:pay': 'Оплата',
  'transaction:refund': 'Возврат',
};

export default function SyncPage() {
  const online = useOnlineStatus();
  const { outbox, isSyncing, lastSyncAt, lastError, refreshOutbox, runPush, cancelItem } = useSyncStore();

  useEffect(() => {
    refreshOutbox();
  }, [refreshOutbox]);

  const handlePush = async () => {
    await runPush();
  };

  const handleCancel = async (item: QueuedMutation) => {
    if (!window.confirm('Убрать эту запись из очереди? Она не будет отправлена на сервер.')) return;
    await cancelItem(item);
  };

  return (
    <div className="space-y-4">
      <BreadCrumbs items={[{ label: 'Синхронизация' }]} />

      <Panel
        title="Синхронизация"
        actions={
          <Button variant="outline" size="sm" disabled={!online || isSyncing || outbox.length === 0} onClick={handlePush}>
            <CloudUpload className="mr-1.5 h-4 w-4" />
            Отправить {outbox.length > 0 ? `(${outbox.length})` : ''}
          </Button>
        }>
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Badge variant={online ? 'secondary' : 'destructive'}>{online ? 'В сети' : 'Офлайн'}</Badge>
          {lastSyncAt && <span>Последняя синхронизация: {new Date(lastSyncAt).toLocaleString('ru-RU')}</span>}
          {isSyncing && (
            <span className="flex items-center gap-1">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Синхронизация...
            </span>
          )}
        </div>

        {lastError && (
          <div className="border-destructive/30 bg-destructive/10 text-destructive mt-3 flex items-start gap-2 rounded-lg border p-3 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{lastError}</span>
          </div>
        )}
      </Panel>

      <Panel title={`Ожидают отправки (${outbox.length})`} bodyClassName="p-0">
        {outbox.length === 0 ? (
          <div className="text-muted-foreground p-6 text-center text-sm">Всё синхронизировано</div>
        ) : (
          <ul className="divide-border divide-y">
            {outbox.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{KIND_LABEL[item.kind] ?? item.kind}</span>
                    {item.status === 'failed' && (
                      <Badge variant="destructive" className="text-xs">
                        ошибка
                      </Badge>
                    )}
                  </div>
                  <div className="text-muted-foreground mt-0.5 text-xs">
                    {new Date(item.createdAt).toLocaleString('ru-RU')}
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
    </div>
  );
}
