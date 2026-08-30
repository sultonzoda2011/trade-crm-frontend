import { useEffect } from 'react';
import { AlertCircle, CloudDownload, CloudUpload, RefreshCw } from 'lucide-react';
import { Panel } from '~/components/layout/Panel';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { useOnlineStatus } from '~/hooks/useOnlineStatus';
import { useSyncStore } from '~/store/useSyncStore';

const ENTITY_LABEL: Record<string, string> = {
  products: 'Товар',
  categories: 'Категория',
  debtors: 'Должник',
  transactions: 'Транзакция',
};

export default function SyncPage() {
  const online = useOnlineStatus();
  const { outbox, isSyncing, lastSyncAt, lastError, refreshOutbox, runPull, runPush } = useSyncStore();

  useEffect(() => {
    refreshOutbox();
  }, [refreshOutbox]);

  const handlePush = async () => {
    await runPush();
  };

  const handlePull = async () => {
    await runPull();
    await refreshOutbox();
  };

  return (
    <div className="space-y-4">
      <BreadCrumbs items={[{ label: 'Синхронизация' }]} />

      <Panel
        title="Синхронизация"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!online || isSyncing} onClick={handlePull}>
              <CloudDownload className="mr-1.5 h-4 w-4" />
              Обновить
            </Button>
            <Button size="sm" disabled={!online || isSyncing || outbox.length === 0} onClick={handlePush}>
              <CloudUpload className="mr-1.5 h-4 w-4" />
              Отправить {outbox.length > 0 ? `(${outbox.length})` : ''}
            </Button>
          </div>
        }>
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Badge variant={online ? 'secondary' : 'destructive'}>{online ? 'В сети' : 'Офлайн'}</Badge>
          {lastSyncAt && <span>Последнее обновление: {new Date(lastSyncAt).toLocaleString('ru-RU')}</span>}
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
                    <span className="font-medium">{ENTITY_LABEL[item.entity] ?? item.entity}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.method === 'post' ? 'создание' : 'изменение'}
                    </Badge>
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
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
