import { useQuery } from '@tanstack/react-query';
import { WifiOff } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router';

import { dashboardApi, type DashboardParams } from '~/api/dashboard';
import { CategoryBreakdown } from '~/components/dashboard/CategoryBreakdown';
import { ProductLeaders } from '~/components/dashboard/ProductLeaders';
import { QueryFallback } from '~/components/dashboard/QueryFallback';
import { Panel } from '~/components/layout/Panel';
import { Reveal } from '~/components/shared/Reveal';
import { Skeleton } from '~/components/ui/skeleton';
import { MIN_DAYS_FOR_TREND } from '~/config/dashboard';
import { useNetworkStatus } from '~/hooks/useNetworkStatus';
import { formatDate } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';
import type { DashboardFilters } from './layout';

function ProductsSkeleton() {
  return (
    <div className="space-y-5 md:space-y-6">
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}

/**
 * The Products tab: what earned the money, what sells in volume, which groups of
 * goods carry the sales.
 *
 * It reads the same request as the Overview for the same period and seller, so
 * switching between the two tabs costs no second load and the figures agree.
 */
export default function DashboardProductsPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const isOnline = useNetworkStatus();
  const { period, sellerId } = useOutletContext<DashboardFilters>();

  const params = useMemo(() => {
    const p: DashboardParams = {};
    if (period) p.period = period;
    if (sellerId) p.sellerId = sellerId;
    return p;
  }, [period, sellerId]);

  const query = useQuery({
    queryKey: queryKeys.dashboard('overview', params),
    queryFn: () => dashboardApi.getOverview(params),
    staleTime: 30_000,
  });

  const overview = query.data?.data;

  if (!overview) {
    if (query.isError || query.fetchStatus === 'paused') {
      return <QueryFallback isError={query.isError} isOffline={query.fetchStatus === 'paused'} onRetry={() => query.refetch()} />;
    }
    return <ProductsSkeleton />;
  }

  // A window of a day or two is too short to compare with the previous one (see the Overview).
  const durationDays = overview.period?.durationDays ?? (period === 'today' ? 1 : MIN_DAYS_FOR_TREND);
  const comparable = durationDays >= MIN_DAYS_FOR_TREND;

  const { topByRevenue, topByUnits } = overview.products;
  const totalRevenue = overview.sales.netRevenue;
  const hasSales = overview.sales.transactionCount > 0 || topByRevenue.length > 0 || overview.categories.length > 0;

  // The backend picks the by-units list from its 20 best-earning products, not from all of them,
  // so the note matters exactly when that list could have been cut: when the money list is full.
  const unitsNote = topByRevenue.length >= 5 ? t('productsTab.topUnits.note') : undefined;

  return (
    <div className="space-y-5 md:space-y-6">
      {!isOnline && (
        <p className="text-muted-foreground flex items-center gap-2 px-1 text-sm">
          <WifiOff className="size-4 shrink-0" />
          {t('offline.dataFrom', { time: formatDate(new Date(query.dataUpdatedAt), true) })}
        </p>
      )}

      {!hasSales ? (
        <Reveal index={0}>
          <Panel bodyClassName="space-y-1">
            <p className="text-base leading-snug font-semibold">{t(`summary.noSales.${period}`)}</p>
            <p className="text-muted-foreground text-sm leading-snug">{t('productsTab.emptyHint')}</p>
          </Panel>
        </Reveal>
      ) : (
        <>
          <div className="grid items-start gap-5 lg:grid-cols-2 lg:gap-6">
            <Reveal index={0}>
              <ProductLeaders metric="revenue" products={topByRevenue} totalRevenue={totalRevenue} />
            </Reveal>
            <Reveal index={1}>
              <ProductLeaders metric="units" products={topByUnits} totalRevenue={totalRevenue} note={unitsNote} />
            </Reveal>
          </div>

          <Reveal index={2}>
            <CategoryBreakdown
              categories={overview.categories}
              period={period}
              comparable={comparable}
              totalRevenue={totalRevenue}
            />
          </Reveal>
        </>
      )}
    </div>
  );
}
