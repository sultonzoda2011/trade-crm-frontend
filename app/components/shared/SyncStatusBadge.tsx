import { Cloud, CloudOff, RefreshCw, TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useOnlineStatus } from '~/hooks/useOnlineStatus';
import { cn } from '~/lib/utils';
import { useSyncStore } from '~/store/useSyncStore';

/**
 * Показывает, откуда сейчас данные в приложении: живые с сервера или из
 * локального кэша, и сколько локальных действий ещё не отправлено.
 * Ставится в Header, рядом с остальными иконками статуса.
 */
export default function SyncStatusBadge() {
  const { t } = useTranslation('common');
  const isOnline = useOnlineStatus();
  const phase = useSyncStore((s) => s.phase);
  const pendingCount = useSyncStore((s) => s.pendingCount);

  let icon = <Cloud className="size-3.5 shrink-0" />;
  let label = t('sync.synced');
  let tone = 'text-muted-foreground border-border';

  if (!isOnline) {
    icon = <CloudOff className="size-3.5 shrink-0" />;
    label = pendingCount > 0 ? t('sync.offlinePending', { count: pendingCount }) : t('sync.offlineNoPending');
    tone = 'text-amber-600 border-amber-600/30 bg-amber-500/10 dark:text-amber-400';
  } else if (phase === 'syncing') {
    icon = <RefreshCw className="size-3.5 shrink-0 animate-spin" />;
    label = t('sync.syncing');
    tone = 'text-muted-foreground border-border';
  } else if (phase === 'error') {
    icon = <TriangleAlert className="size-3.5 shrink-0" />;
    label = t('sync.error', { count: pendingCount });
    tone = 'text-destructive border-destructive/30 bg-destructive/10';
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors',
        tone
      )}>
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}
