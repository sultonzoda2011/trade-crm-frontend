import { useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  HandCoins,
  Loader2,
  Package,
  ReceiptText,
  RefreshCw,
  Store,
  Tag,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ListGroup, ListRow } from '~/components/shared/ListGroup';
import { useCacheCoverage } from '~/hooks/useCacheCoverage';
import { useNetworkStatus } from '~/hooks/useNetworkStatus';
import { fmtNum } from '~/lib/format';
import { FRESH_WINDOW_MS } from '~/lib/offline-sync';
import type { Entity } from '~/lib/query-keys';
import { cn } from '~/lib/utils';
import { useSyncStore } from '~/store/useSyncStore';

const ICONS: Record<Entity, LucideIcon> = {
  transactions: ReceiptText,
  debtors: HandCoins,
  products: Package,
  categories: Tag,
  sellers: UserRound,
  markets: Store,
  users: Users,
};

/** Что из данных уже лежит на устройстве и откроется без интернета. У каждой строки — своя кнопка «Обновить». */
export function CoverageSection() {
  const { t } = useTranslation('sync');
  const queryClient = useQueryClient();
  const coverage = useCacheCoverage();
  const isOnline = useNetworkStatus();

  const running = useSyncStore((s) => s.running);
  const runningScope = useSyncStore((s) => s.scope);
  const start = useSyncStore((s) => s.start);

  if (coverage.length === 0) return null;

  return (
    <ListGroup title={t('data.title')} footer={t('data.footer')}>
      {coverage.map((item) => {
        const Icon = ICONS[item.entity];
        const complete = item.target !== null && item.details >= item.target && item.target > 0;
        const fresh =
          item.target !== null &&
          item.details >= item.target &&
          item.updatedAt !== null &&
          Date.now() - item.updatedAt < FRESH_WINDOW_MS;
        const isRunningThis = running && runningScope === item.entity;

        // Рынок у владельца/продавца — одна своя запись без списка: «total» нет, есть только карточка.
        let value: string;
        if (item.target !== null) value = t('data.cards', { done: fmtNum(item.details), total: fmtNum(item.target) });
        else if (item.details > 0) value = t('data.cardsOnly', { count: item.details });
        else value = t('data.notLoaded');

        return (
          <ListRow
            key={item.entity}
            leading={
              <span className="bg-primary/12 text-primary flex size-10 items-center justify-center rounded-full">
                <Icon className="size-5" />
              </span>
            }
            title={t(`data.entities.${item.entity}`)}
            value={
              <span className="flex items-center gap-1.5">
                {complete && <CheckCircle2 className="text-success size-4" aria-hidden />}
                {value}
              </span>
            }
            trailing={
              <button
                type="button"
                aria-label={t('data.refresh', { entity: t(`data.entities.${item.entity}`) })}
                disabled={!isOnline || running || fresh}
                onClick={() => void start(queryClient, item.entity)}
                className={cn(
                  'text-muted-foreground -mr-1 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors',
                  !isOnline || running || fresh ? 'opacity-40' : 'active:bg-muted/70'
                )}>
                {isRunningThis ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="size-4" aria-hidden />
                )}
              </button>
            }
          />
        );
      })}
    </ListGroup>
  );
}
