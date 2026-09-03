import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloudDownload, FileStack } from 'lucide-react';
import { Panel } from '~/components/layout/Panel';
import { Button } from '~/components/ui/button';
import { Progress } from '~/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { useOnlineStatus } from '~/hooks/useOnlineStatus';
import { syncEntityDetails, syncEntityList, type DetailSyncProgress, type ListSyncItem, type ListSyncProgress } from '~/lib/offline/entitySync';
import type { SyncEntityConfig } from '~/lib/offline/entities';

interface SyncEntityPageProps {
  entity: SyncEntityConfig;
}

export function SyncEntityPage({ entity }: SyncEntityPageProps) {
  const { t } = useTranslation(['sync', 'common']);
  const online = useOnlineStatus();
  const offline = !online;

  const [listProgress, setListProgress] = useState<ListSyncProgress | null>(null);
  const [isListSyncing, setIsListSyncing] = useState(false);
  const [lastItems, setLastItems] = useState<ListSyncItem[] | null>(null);

  const [detailProgress, setDetailProgress] = useState<DetailSyncProgress | null>(null);
  const [isDetailSyncing, setIsDetailSyncing] = useState(false);

  const handleSyncList = async () => {
    setIsListSyncing(true);
    setListProgress(null);
    try {
      const items = await syncEntityList(entity, setListProgress);
      setLastItems(items);
    } finally {
      setIsListSyncing(false);
    }
  };

  const handleSyncDetails = async () => {
    if (!lastItems || !entity.hasDetail) return;
    setIsDetailSyncing(true);
    setDetailProgress(null);
    try {
      await syncEntityDetails(entity, lastItems, setDetailProgress);
    } finally {
      setIsDetailSyncing(false);
    }
  };

  const listPercent = listProgress ? Math.round((listProgress.page / listProgress.totalPages) * 100) : 0;
  const detailPercent = detailProgress ? Math.round((detailProgress.done / detailProgress.total) * 100) : 0;

  const offlineReason = t('offlineTooltip');

  return (
    <div className="space-y-4">
      <BreadCrumbs items={[{ label: t('title'), link: '/sync' }, { label: t(entity.labelKey) }]} />

      <Panel title={t(entity.labelKey)}>
        <div className="space-y-6">
          {/* Шаг 1: список */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <ActionButton
                disabled={!online || isListSyncing}
                loading={isListSyncing}
                offline={!online}
                offlineReason={offlineReason}
                onClick={handleSyncList}
                icon={<CloudDownload className="size-4" />}
                label={t('syncList')}
              />
              {listProgress && (
                <span className="text-muted-foreground text-sm">
                  {t('pageProgress', { page: listProgress.page, total: listProgress.totalPages })}
                </span>
              )}
            </div>
            <p className={offline ? 'text-warning text-sm font-medium' : 'text-muted-foreground text-sm'}>
              {offline ? offlineReason : t('syncListDescription')}
            </p>
            {isListSyncing && <Progress value={listPercent} className="h-2" />}
          </div>

          {/* Шаг 2: карточки по id — доступен только после списка */}
          {entity.hasDetail && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <ActionButton
                  disabled={!online || isDetailSyncing || !lastItems}
                  loading={isDetailSyncing}
                  offline={!online}
                  offlineReason={offlineReason}
                  onClick={handleSyncDetails}
                  icon={<FileStack className="size-4" />}
                  label={t('syncDetails')}
                />
                {detailProgress && (
                  <span className="text-muted-foreground text-sm">
                    {t('detailProgress', { done: detailProgress.done, total: detailProgress.total })}
                    {detailProgress.skipped > 0 && ` · ${t('detailSkipped', { count: detailProgress.skipped })}`}
                  </span>
                )}
              </div>
              <p className={offline ? 'text-warning text-sm font-medium' : 'text-muted-foreground text-sm'}>
                {offline ? offlineReason : lastItems ? t('syncDetailsDescription') : t('syncDetailsRequiresList')}
              </p>
              {isDetailSyncing && <Progress value={detailPercent} className="h-2" />}
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}

function ActionButton({
  disabled,
  loading,
  offline,
  offlineReason,
  onClick,
  icon,
  label,
}: {
  disabled: boolean;
  loading: boolean;
  offline: boolean;
  offlineReason: string;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  const button = (
    <Button disabled={disabled} onClick={onClick} className="gap-2">
      {icon}
      {label}
    </Button>
  );

  // Тултип показывается только при наведении мышью (на touch-устройствах он
  // скрыт глобально, см. components/ui/tooltip.tsx) — поэтому причина "нет
  // сети" ВСЕГДА продублирована текстом под кнопкой (см. syncListDescription
  // /offline-состояние ниже), а тултип это просто бонус для десктопа.
  if (!offline) return button;

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent side="top">{offlineReason}</TooltipContent>
    </Tooltip>
  );
}
