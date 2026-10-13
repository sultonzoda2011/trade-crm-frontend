import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CloudDownload, RefreshCw, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { useAllUpToDate } from '~/hooks/useAllUpToDate';
import { useNetworkStatus } from '~/hooks/useNetworkStatus';
import { useOfflineQueue } from '~/hooks/useOfflineQueue';
import { cn } from '~/lib/utils';
import { syncPercent, useSyncStore } from '~/store/useSyncStore';

type Tone = 'destructive' | 'default' | 'secondary';

/**
 * Кластер в шапке: бейдж состояния (ведёт на /sync) и рядом кнопка «загрузить всё».
 * Бейдж показывается, только когда есть что сказать: нет сети, ошибки в очереди,
 * идёт загрузка или есть неотправленное. Когда всё спокойно — в шапке одна иконка.
 */
export function SyncStatus() {
  const { t } = useTranslation('sync');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isOnline = useNetworkStatus();
  const { pending, failed, total } = useOfflineQueue();

  const running = useSyncStore((s) => s.running);
  const snapshot = useSyncStore((s) => s.snapshot);
  const start = useSyncStore((s) => s.start);
  const allUpToDate = useAllUpToDate();

  const percent = syncPercent(snapshot);
  // Пока идёт загрузка, кнопка всегда кликабельна — ведёт на /sync. Иначе
  // недоступна без сети или когда качать уже нечего (всё свежее и полное).
  const syncDisabled = !running && (!isOnline || allUpToDate);
  const syncLabel = running ? t('header.open') : allUpToDate ? t('button.upToDate') : t('header.syncAll');

  let badge: { tone: Tone; icon: typeof WifiOff; short: string; label: string } | null = null;
  if (failed > 0) {
    badge = {
      tone: 'destructive',
      icon: AlertTriangle,
      short: String(failed),
      label: t('status.failed', { count: failed }),
    };
  } else if (!isOnline) {
    badge = {
      tone: 'destructive',
      icon: WifiOff,
      short: total > 0 ? String(total) : '',
      label: total > 0 ? `${t('status.offline')} · ${t('status.queue', { count: total })}` : t('status.offline'),
    };
  } else if (running) {
    badge = {
      tone: 'default',
      icon: CloudDownload,
      short: percent !== null ? `${percent}%` : '',
      label: percent !== null ? `${t('status.syncing')} · ${percent}%` : t('status.syncing'),
    };
  } else if (pending > 0) {
    badge = {
      tone: 'secondary',
      icon: RefreshCw,
      short: String(pending),
      label: t('status.queue', { count: pending }),
    };
  }

  const Icon = badge?.icon;

  return (
    <>
      {badge && Icon && (
        <Tooltip>
          <TooltipTrigger
            render={
              // Сам бейдж низкий (24px), а нажимается область 44px — иначе в него не попасть пальцем.
              <Link to="/sync" aria-label={badge.label} className="flex h-11 items-center md:h-10">
                <Badge variant={badge.tone} className="gap-1">
                  <Icon className="size-3" strokeWidth={2} />
                  {badge.short && <span className="tabular-nums">{badge.short}</span>}
                  {!badge.short && <span className="hidden sm:inline">{badge.label}</span>}
                </Badge>
              </Link>
            }
          />
          <TooltipContent side="bottom">{badge.label}</TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="glass"
              size="icon"
              className="text-primary md:text-foreground"
              aria-label={syncLabel}
              disabled={syncDisabled}
              // Во время загрузки повторный запуск не нужен — открываем страницу с прогрессом.
              onClick={() => (running ? navigate('/sync') : void start(queryClient))}>
              <RefreshCw
                className={cn('size-5 md:size-4', running && 'animate-spin motion-reduce:animate-none')}
                strokeWidth={1.75}
              />
            </Button>
          }
        />
        <TooltipContent side="bottom">{syncLabel}</TooltipContent>
      </Tooltip>
    </>
  );
}
