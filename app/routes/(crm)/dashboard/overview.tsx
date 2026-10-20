import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, WifiOff } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useOutletContext, useSearchParams } from 'react-router';
import { dashboardApi, type DashboardParams } from '~/api/dashboard';
import { transactionsApi } from '~/api/transactions';
import { AttentionList } from '~/components/dashboard/AttentionList';
import { BestSellers } from '~/components/dashboard/BestSellers';
import { DebtsCard } from '~/components/dashboard/DebtsCard';
import { PaymentDistributionChart } from '~/components/dashboard/PaymentDistributionChart';
import { PeriodDetails } from '~/components/dashboard/PeriodDetails';
import { RevenueTrendChart } from '~/components/dashboard/RevenueTrendChart';
import { SalesChanges } from '~/components/dashboard/SalesChanges';
import { SalesSummary } from '~/components/dashboard/SalesSummary';
import { StockWatch } from '~/components/dashboard/StockWatch';
import { Panel } from '~/components/layout/Panel';
import { PanelViewAll } from '~/components/shared/PanelViewAll';
import { Reveal } from '~/components/shared/Reveal';
import { TransactionRow } from '~/components/shared/TransactionRow';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { MIN_DAYS_FOR_TREND, RECENT_TRANSACTIONS_LIMIT, STOCK_ANALYSIS_DAYS } from '~/config/dashboard';
import type { Period } from '~/config/period';
import { useCan } from '~/hooks/useCan';
import { useNetworkStatus } from '~/hooks/useNetworkStatus';
import { formatDate } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';
import type { BusinessInsight } from '~/types/analytics';
import type { DashboardFilters } from './layout';

/** Router state for links to an unfiltered list: tells the list to drop filters left from an earlier visit. */
const FRESH_LIST = { freshList: true };

const SEVERITY_ORDER: Record<BusinessInsight['severity'], number> = { critical: 0, warning: 1, info: 2, success: 3 };

/** Rules that the screen already answers elsewhere or that mean nothing in a short window. */
interface AttentionContext {
  period: Period;
  /** The window is long enough to compare with the previous one. */
  comparable: boolean;
}

/**
 * The alert list: only critical and warning rules, from two sources.
 *
 *  - sales / debts / returns come from the selected period;
 *  - stock comes from the fixed trailing window, the same one the stock card uses,
 *    so the sentence and the card under it can never disagree.
 *
 * Left out on purpose: "no sales" (the headline card already says so, and in the
 * morning it is simply true), "slow-moving stock" (it has its own line in the stock
 * card), a "revenue fell" alert for a window too short to compare, and "no payments
 * collected" for a single day — one day without a payment is normal, the rule is
 * about weeks.
 */
function buildAttention(
  periodInsights: BusinessInsight[],
  stockInsights: BusinessInsight[],
  { period, comparable }: AttentionContext
): BusinessInsight[] {
  const fromPeriod = periodInsights.filter(
    (insight) =>
      insight.category !== 'inventory' &&
      insight.id !== 'sales.noSales' &&
      !(insight.id === 'sales.declining' && !comparable) &&
      !(insight.id === 'debts.noCollection' && period === 'today')
  );
  const fromStock = stockInsights.filter(
    (insight) => insight.category === 'inventory' && insight.id !== 'inventory.slowMoving'
  );

  return [...fromPeriod, ...fromStock]
    .filter((insight) => insight.severity === 'critical' || insight.severity === 'warning')
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

function OverviewSkeleton() {
  return (
    <div className="space-y-5 md:space-y-6">
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  );
}

export default function DashboardOverviewPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isOnline = useNetworkStatus();
  const { user } = useCan();
  const { period, sellerId } = useOutletContext<DashboardFilters>();

  const params = useMemo(() => {
    const p: DashboardParams = {};
    if (period) p.period = period;
    if (sellerId) p.sellerId = sellerId;
    return p;
  }, [period, sellerId]);

  const overviewQuery = useQuery({
    queryKey: queryKeys.dashboard('overview', params),
    queryFn: () => dashboardApi.getOverview(params),
    staleTime: 30_000,
  });

  // Stock does not depend on the period or the seller in the filter bar, so its
  // key carries neither: flipping the filters does not refetch it, and the copy
  // saved on the phone is found again offline.
  const stockQuery = useQuery({
    queryKey: queryKeys.dashboard('stock', { days: STOCK_ANALYSIS_DAYS }),
    queryFn: () => dashboardApi.getStockOverview(),
    staleTime: 5 * 60_000,
  });

  // Своя, самая свежая выдача транзакций — не пересчитывается из overview,
  // это просто "последние N по времени", как и на странице должника.
  // Продавец из фильтра применяется и здесь: без него при выбранном продавце
  // рядом с его цифрами показывались чужие операции. Период не применяется —
  // это именно «последние», а не «за период».
  const recentQuery = useQuery({
    queryKey: queryKeys.dashboard('recent-transactions', { sellerId }),
    queryFn: () =>
      transactionsApi.getAll(
        1,
        RECENT_TRANSACTIONS_LIMIT,
        { sortBy: 'createdAt', sortOrder: 'desc' },
        sellerId ? [{ key: 'createdById', value: sellerId }] : []
      ),
    staleTime: 30_000,
  });
  const recentTransactions = recentQuery.data?.data?.data ?? [];
  const recentTransactionsTotal = recentQuery.data?.data?.meta?.total ?? 0;

  const overview = overviewQuery.data?.data;
  const stock = stockQuery.data?.data;
  const scope = { period, sellerId };

  // A window shorter than a few days is too small to call a trend or a drop:
  // it is either a partial "today" set against a whole yesterday, or a Monday.
  const durationDays = overview?.period?.durationDays ?? (period === 'today' ? 1 : MIN_DAYS_FOR_TREND);
  const comparable = durationDays >= MIN_DAYS_FOR_TREND;
  const attention = useMemo(
    () => (overview ? buildAttention(overview.insights, stock?.insights ?? [], { period, comparable }) : []),
    [overview, stock, period, comparable]
  );

  if (!overview) {
    if (overviewQuery.isError) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
          <AlertTriangle className="text-destructive size-8" />
          <p className="font-medium">{t('loadError')}</p>
          <Button variant="outline" onClick={() => overviewQuery.refetch()}>
            {t('actions.retry', { ns: 'common' })}
          </Button>
        </div>
      );
    }

    // Paused = no connection and nothing saved for this view yet. A spinner that
    // never ends would read as "slow", not as "offline".
    if (overviewQuery.fetchStatus === 'paused') {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
          <WifiOff className="text-muted-foreground/50 size-8" />
          <p className="text-muted-foreground max-w-xs text-sm">{t('offline.noCachedData', { ns: 'common' })}</p>
          <Link to="/sync" className="text-primary flex min-h-11 items-center text-sm font-medium">
            {t('offlineHint.action', { ns: 'sync' })}
          </Link>
        </div>
      );
    }

    return <OverviewSkeleton />;
  }

  // How many days "due soon" means is the backend's rule; it reports it in the
  // recommendation. No such recommendation means no debt is due soon.
  const dueSoonParam = overview.insights.find((insight) => insight.id === 'debts.dueSoon')?.params.days;
  const dueSoonDays = typeof dueSoonParam === 'number' ? dueSoonParam : undefined;

  return (
    <div className="space-y-5 md:space-y-6">
      {!isOnline && (
        <p className="text-muted-foreground flex items-center gap-2 px-1 text-sm">
          <WifiOff className="size-4 shrink-0" />
          {t('offline.dataFrom', { time: formatDate(new Date(overviewQuery.dataUpdatedAt), true) })}
        </p>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-2 lg:gap-6">
        <Reveal index={0}>
          <SalesSummary overview={overview} scope={scope} />
        </Reveal>
        <Reveal index={1}>
          <AttentionList insights={attention} scope={scope} />
        </Reveal>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2 lg:gap-6">
        <Reveal index={2}>
          <DebtsCard debts={overview.debts} scope={scope} dueSoonDays={dueSoonDays} />
        </Reveal>
        <Reveal index={3}>
          <StockWatch
            data={stock}
            isLoading={stockQuery.isLoading}
            isError={stockQuery.isError}
            isOffline={stockQuery.fetchStatus === 'paused'}
            onRetry={() => stockQuery.refetch()}
            sellerScoped={Boolean(sellerId)}
          />
        </Reveal>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2 lg:gap-6">
        <Reveal index={4}>
          <BestSellers products={overview.products.topByRevenue} detailsTo={`/dashboard/products?${searchParams.toString()}`} />
        </Reveal>
        <Reveal index={5}>
          {comparable ? (
            <SalesChanges categories={overview.categories} period={period} />
          ) : (
            <PaymentDistributionChart data={overview.paymentMix} />
          )}
        </Reveal>
      </div>

      {comparable && (
        <div className="grid items-start gap-5 lg:grid-cols-3 lg:gap-6">
          <Reveal index={6} className="lg:col-span-2">
            <RevenueTrendChart data={overview.revenueTrend} />
          </Reveal>
          <Reveal index={7}>
            <PaymentDistributionChart data={overview.paymentMix} />
          </Reveal>
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-2 lg:gap-6">
        <Reveal index={8}>
          <PeriodDetails overview={overview} scope={scope} />
        </Reveal>
        <Reveal index={9}>
          <Panel
            title={t('recent.title')}
            actions={
              <PanelViewAll
                to={sellerId ? `/transactions?createdById=${encodeURIComponent(sellerId)}` : '/transactions'}
                label={t('viewAll')}
                count={recentTransactionsTotal}
                state={FRESH_LIST}
              />
            }
            bodyClassName="overflow-hidden p-0">
            {recentQuery.isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentTransactions.length === 0 ? (
              <p className="text-muted-foreground px-4 py-5 text-sm">{t('recent.empty')}</p>
            ) : (
              <div className="divide-border divide-y">
                {recentTransactions.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    t={t}
                    to={`/transactions/${tx.id}`}
                    state={{ fromPath: location.pathname, fromName: t('title') }}
                  />
                ))}
              </div>
            )}
          </Panel>
        </Reveal>
      </div>

      {!user?.marketId && (
        /* ADMIN без своего рынка видит сводку по всем рынкам, поэтому
           ссылка на управление рынками имеет смысл только здесь. */
        <Button variant="ghost" size="sm" className="gap-1" render={<Link to="/markets" />}>
          {t('allMarkets')} <ArrowRight className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
