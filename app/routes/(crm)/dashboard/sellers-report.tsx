import { useQuery } from '@tanstack/react-query';
import { WifiOff } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useOutletContext } from 'react-router';

import { dashboardApi, type DashboardParams } from '~/api/dashboard';
import { QueryFallback } from '~/components/dashboard/QueryFallback';
import { SellersRanking } from '~/components/dashboard/SellersRanking';
import { SellersSummary } from '~/components/dashboard/SellersSummary';
import { Panel } from '~/components/layout/Panel';
import { Reveal } from '~/components/shared/Reveal';
import { Skeleton } from '~/components/ui/skeleton';
import { Action } from '~/config/actions';
import { MIN_DAYS_FOR_TREND } from '~/config/dashboard';
import { useCan } from '~/hooks/useCan';
import { useNetworkStatus } from '~/hooks/useNetworkStatus';
import { sellerRowLink } from '~/lib/dashboard-links';
import { getPeriodDays } from '~/lib/date';
import { formatDate } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';
import { rankSellers, summarize } from '~/lib/seller-report';
import type { DashboardFilters } from './layout';

function SellersSkeleton() {
  return (
    <div className="space-y-5 md:space-y-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-6">
        <Skeleton className="h-60 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}

/**
 * The Sellers tab: who sold how much, and what each of them is made of.
 *
 * Period and seller filters apply. The list is the Overview's "Sold" split per
 * person, so with no seller picked the total here equals the one there.
 *
 * Whom a row opens depends on who it is and who is looking: the owner's own row
 * leads to their profile, an admin opening an owner (or another admin) goes to the
 * user card, a seller to the seller card — see `sellerRowLink`.
 */
export default function SellersReportPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const location = useLocation();
  const isOnline = useNetworkStatus();
  const { can, user } = useCan();
  const { period, sellerId } = useOutletContext<DashboardFilters>();

  const params = useMemo(() => {
    const p: DashboardParams = {};
    if (period) p.period = period;
    if (sellerId) p.sellerId = sellerId;
    return p;
  }, [period, sellerId]);

  const query = useQuery({
    queryKey: queryKeys.dashboard('sellers-report', params),
    queryFn: () => dashboardApi.getSellersReport(params),
    staleTime: 30_000,
  });

  const report = query.data?.data;
  const rows = useMemo(() => rankSellers(report ?? []), [report]);
  const totals = useMemo(() => summarize(rows), [rows]);

  if (!report) {
    if (query.isError || query.fetchStatus === 'paused') {
      return (
        <QueryFallback
          isError={query.isError}
          isOffline={query.fetchStatus === 'paused'}
          onRetry={() => query.refetch()}
        />
      );
    }
    return <SellersSkeleton />;
  }

  // The report carries no `durationDays` like the overview does; the window is the same
  // calendar one, so it is counted from the period itself. A day or two is too short to compare.
  const comparable = getPeriodDays(period) >= MIN_DAYS_FOR_TREND;

  const viewer = { id: user?.id, canViewUsers: can(Action.USERS_VIEW), canViewSellers: can(Action.SELLERS_VIEW) };
  // Back from a card returns to this tab with the same period and seller still picked.
  const linkState = { fromPath: `${location.pathname}${location.search}`, fromName: t('title') };

  return (
    <div className="space-y-5 md:space-y-6">
      {!isOnline && (
        <p className="text-muted-foreground flex items-center gap-2 px-1 text-sm">
          <WifiOff className="size-4 shrink-0" />
          {t('offline.dataFrom', { time: formatDate(new Date(query.dataUpdatedAt), true) })}
        </p>
      )}

      {rows.length === 0 ? (
        <Reveal index={0}>
          <Panel bodyClassName="space-y-1">
            <p className="text-base leading-snug font-semibold">{t(`summary.noSales.${period}`)}</p>
            <p className="text-muted-foreground text-sm leading-snug">{t('sellersTab.emptyHint')}</p>
          </Panel>
        </Reveal>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-6">
          <Reveal index={0}>
            <SellersSummary totals={totals} period={period} comparable={comparable} />
          </Reveal>
          <Reveal index={1}>
            <SellersRanking
              rows={rows}
              totalSold={totals.sold}
              comparable={comparable}
              getLink={(seller) => sellerRowLink(seller, viewer)}
              linkState={linkState}
            />
          </Reveal>
        </div>
      )}
    </div>
  );
}
