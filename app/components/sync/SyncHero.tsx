import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '~/components/ui/button';
import { Progress } from '~/components/ui/progress';
import { useCacheCoverage } from '~/hooks/useCacheCoverage';
import { useNetworkStatus } from '~/hooks/useNetworkStatus';
import { formatDate } from '~/lib/format';
import { FRESH_WINDOW_MS } from '~/lib/offline-sync';
import { cn } from '~/lib/utils';
import { syncPercent, useSyncStore } from '~/store/useSyncStore';

/** Все доступные роли сущности загружены недавно и в полном объёме — качать нечего. */
function useAllUpToDate(): boolean {
  const coverage = useCacheCoverage();
  if (coverage.length === 0) return false;
  const now = Date.now();
  return coverage.every(
    (item) =>
      item.target !== null &&
      item.details >= item.target &&
      item.updatedAt !== null &&
      now - item.updatedAt < FRESH_WINDOW_MS
  );
}

/** Секунды до конца паузы по требованию сервера; тикает раз в секунду, пока пауза идёт. */
function useCountdown(until: number | null | undefined): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [until]);
  return until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0;
}

/** Верх страницы: есть ли связь, когда данные обновлялись в последний раз, главная кнопка и прогресс. */
export function SyncHero() {
  const { t } = useTranslation('sync');
  const queryClient = useQueryClient();
  const isOnline = useNetworkStatus();

  const running = useSyncStore((s) => s.running);
  const snapshot = useSyncStore((s) => s.snapshot);
  const outcome = useSyncStore((s) => s.outcome);
  const lastSync = useSyncStore((s) => s.lastSync);
  const start = useSyncStore((s) => s.start);
  const cancel = useSyncStore((s) => s.cancel);
  const allUpToDate = useAllUpToDate();

  const percent = syncPercent(snapshot);
  const secondsLeft = useCountdown(snapshot?.throttledUntil);

  let message: string;
  if (running && snapshot?.waitingNetwork) message = t('hero.waitingNetwork');
  else if (running && snapshot?.throttledUntil) message = t('hero.throttled', { seconds: secondsLeft });
  else if (running && (!snapshot || snapshot.phase === 'preparing')) message = t('hero.preparing');
  else if (running && snapshot) message = t('hero.progress', { done: snapshot.done, total: snapshot.total });
  else if (!isOnline) message = t('hero.offlineText');
  else if (outcome === 'partial') message = t('hero.partial');
  else if (outcome === 'throttled') message = t('hero.throttledEnd');
  else if (allUpToDate) message = t('hero.upToDate');
  else if (lastSync) message = t('hero.lastSync', { date: formatDate(new Date(lastSync.finishedAt), true) });
  else message = t('hero.neverSynced');

  return (
    <section className="bg-card flex flex-col gap-4 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-full',
            isOnline ? 'bg-success/12 text-success' : 'bg-destructive/12 text-destructive'
          )}>
          {isOnline ? <Wifi className="size-6" /> : <WifiOff className="size-6" />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg leading-tight font-semibold">
            {isOnline ? t('hero.onlineTitle') : t('hero.offlineTitle')}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm leading-snug">{message}</p>
        </div>
      </div>

      {running && (
        <div className="flex flex-col gap-1.5">
          <Progress
            value={percent ?? 8}
            className={cn('h-2', percent === null && 'animate-pulse')}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent ?? undefined}
          />
          {snapshot && snapshot.failed > 0 && (
            <p className="text-destructive text-xs">{t('hero.failedCount', { count: snapshot.failed })}</p>
          )}
        </div>
      )}

      {running ? (
        <Button variant="outline" size="lg" className="w-full" onClick={cancel}>
          {t('button.cancel')}
        </Button>
      ) : (
        <Button
          size="lg"
          className="w-full"
          disabled={!isOnline || allUpToDate}
          onClick={() => void start(queryClient)}>
          <RefreshCw data-icon="inline-start" />
          {!isOnline ? t('button.noNetwork') : allUpToDate ? t('button.upToDate') : t('button.syncAll')}
        </Button>
      )}
    </section>
  );
}
