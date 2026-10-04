import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Package,
  PackageCheck,
  PackagePlus,
  Receipt,
  ShoppingCart,
  TicketPercent,
  Undo2,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useOutletContext } from 'react-router';
import { dashboardApi, type DashboardParams } from '~/api/dashboard';
import { transactionsApi } from '~/api/transactions';
import { InsightList } from '~/components/dashboard/InsightList';
import { MetricCard } from '~/components/dashboard/MetricCard';
import { OverdueAlertCard } from '~/components/dashboard/OverdueAlertCard';
import { PaymentDistributionChart } from '~/components/dashboard/PaymentDistributionChart';
import { RevenueTrendChart } from '~/components/dashboard/RevenueTrendChart';
import { Panel } from '~/components/layout/Panel';
import { PanelViewAll } from '~/components/shared/PanelViewAll';
import { StatCard } from '~/components/shared/StatCard';
import { TransactionRow } from '~/components/shared/TransactionRow';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { useCan } from '~/hooks/useCan';
import { transactionsLink } from '~/lib/dashboard-links';
import { fmtTJS } from '~/lib/format';
import type { DashboardFilters } from './layout';
import { queryKeys } from '~/lib/query-keys';

/** Сколько последних операций показывать на дашборде превью-списком. */
const RECENT_TRANSACTIONS_LIMIT = 5;

/** Router state for links to an unfiltered list: tells the list to drop filters left from an earlier visit. */
const FRESH_LIST = { freshList: true };

export default function DashboardOverviewPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const { user } = useCan();
  const location = useLocation();
  const { period, sellerId } = useOutletContext<DashboardFilters>();

  const params = useMemo(() => {
    const p: DashboardParams = {};
    if (period) p.period = period;
    if (sellerId) p.sellerId = sellerId;
    return p;
  }, [period, sellerId]);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.dashboard('overview', params),
    queryFn: () => dashboardApi.getOverview(params),
    staleTime: 30_000,
  });

  // Своя, самая свежая выдача транзакций — не пересчитывается из overview,
  // это просто "последние N по времени", как и на странице должника.
  // Продавец из фильтра применяется и здесь: без него при выбранном продавце
  // рядом с его цифрами показывались чужие операции. Период не применяется —
  // это именно «последние», а не «за период».
  const { data: recentTx } = useQuery({
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
  const recentTransactions = recentTx?.data?.data ?? [];
  const recentTransactionsTotal = recentTx?.data?.meta?.total ?? 0;

  const overview = data?.data;
  const scope = { period, sellerId };

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <div className="text-center">
          <AlertTriangle className="text-destructive mx-auto mb-3 size-8" />
          <p className="font-medium">{t('loadError')}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !overview) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-56 w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const { sales, debts, returns, inventory, insights } = overview;

  return (
    <div className="space-y-6">
      <InsightList insights={insights} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricCard
          className="col-span-2 lg:col-span-1"
          icon={Banknote}
          label={t('metrics.revenue')}
          value={fmtTJS(sales.netRevenue)}
          hint={t('metrics.revenueHint', {
            sales: fmtTJS(sales.saleRevenue),
            debts: fmtTJS(sales.debtIssued),
          })}
          comparison={sales.comparison.netRevenue}
          to={transactionsLink(scope)}
        />
        <MetricCard
          icon={Receipt}
          label={t('metrics.transactions')}
          value={sales.transactionCount}
          hint={t('metrics.transactionsHint', { sales: sales.saleCount, debts: sales.debtCount })}
          comparison={sales.comparison.transactionCount}
          to={transactionsLink(scope)}
        />
        <MetricCard
          icon={ShoppingCart}
          label={t('metrics.averageCheck')}
          value={fmtTJS(sales.averageCheck)}
          hint={t('metrics.unitsSold', { count: sales.unitsSold })}
          comparison={sales.comparison.averageCheck}
        />
        <MetricCard
          icon={Undo2}
          label={t('metrics.returns')}
          value={fmtTJS(returns.amount)}
          hint={t('metrics.returnsHint', { percent: Math.round(returns.returnRate * 1000) / 10 })}
          comparison={returns.comparison.amount}
          invertComparison
          to={transactionsLink(scope, { type: 'REFUND' })}
        />
      </div>

      <div className="grid items-stretch gap-6 lg:grid-cols-3">
        <RevenueTrendChart data={overview.revenueTrend} />
        <PaymentDistributionChart data={overview.paymentMix} />
      </div>

      <div className="grid items-stretch gap-6 lg:grid-cols-3">
        <OverdueAlertCard debts={debts} scope={scope} />

        <Panel title={t('stockSummary')} className="lg:col-span-1" bodyClassName="space-y-2">
          <div className="grid grid-cols-2 gap-2 sm:gap-5">
            <StatCard
              align="start"
              size="sm"
              icon={Package}
              label={t('inventory.total')}
              value={inventory.totalProducts}
              to="/products"
              state={FRESH_LIST}
            />

            <StatCard
              align="start"
              size="sm"
              icon={PackagePlus}
              label={t('inventory.toOrder')}
              value={inventory.needsReorder}
              to="/products?needsReorder=true"
              valueClassName="text-warning"
              iconClassName="bg-warning/10 text-warning"
            />

            <StatCard
              align="start"
              size="sm"
              icon={PackageCheck}
              label={t('inventory.healthy')}
              value={inventory.healthy}
              to="/products?health=HEALTHY"
              valueClassName="text-success"
              iconClassName="bg-success/10 text-success"
            />

            <StatCard
              align="start"
              size="sm"
              icon={TicketPercent}
              label={t('metrics.discounts')}
              value={fmtTJS(sales.discountAmount)}
              to={transactionsLink(scope)}
            />
          </div>
          {!user?.marketId && (
            /* ADMIN без своего рынка видит сводку по всем рынкам, поэтому
               ссылка на управление рынками имеет смысл только здесь. */
            <Button variant="ghost" size="sm" className="gap-1 text-xs" render={<Link to="/markets" />}>
              {t('allMarkets')} <ArrowRight className="size-3.5" />
            </Button>
          )}
        </Panel>
      </div>

      <Panel
        title={t('recentTransactions')}
        actions={
          <PanelViewAll
            to={sellerId ? `/transactions?createdById=${encodeURIComponent(sellerId)}` : '/transactions'}
            label={t('viewAll')}
            count={recentTransactionsTotal}
            state={FRESH_LIST}
          />
        }
        bodyClassName="p-0">
        {recentTransactions.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">{t('empty')}</p>
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
    </div>
  );
}
