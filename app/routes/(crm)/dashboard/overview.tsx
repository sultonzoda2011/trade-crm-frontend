import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, Banknote, Package, Receipt, ShoppingCart, Undo2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useOutletContext } from 'react-router';
import { dashboardApi, type DashboardParams } from '~/api/dashboard';
import { InsightList } from '~/components/dashboard/InsightList';
import { MetricCard } from '~/components/dashboard/MetricCard';
import { OverdueAlertCard } from '~/components/dashboard/OverdueAlertCard';
import { PaymentDistributionChart } from '~/components/dashboard/PaymentDistributionChart';
import { RevenueTrendChart } from '~/components/dashboard/RevenueTrendChart';
import { Panel } from '~/components/layout/Panel';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { useCan } from '~/hooks/useCan';
import { fmtTJS, formatDate } from '~/lib/format';
import type { DashboardFilters } from './layout';

export default function DashboardOverviewPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const { user } = useCan();
  const { period, sellerId } = useOutletContext<DashboardFilters>();

  const params = useMemo(() => {
    const p: DashboardParams = {};
    if (period) p.period = period;
    if (sellerId) p.sellerId = sellerId;
    return p;
  }, [period, sellerId]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'overview', params],
    queryFn: () => dashboardApi.getOverview(params),
    staleTime: 30_000,
  });

  const overview = data?.data;

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <div className="text-center">
          <AlertTriangle className="text-destructive mx-auto mb-3 h-8 w-8" />
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
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-56 w-full rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const { sales, debts, returns, inventory, insights, period: range } = overview;

  return (
    <div className="space-y-6">
      {/* Какой именно отрезок сейчас на экране — иначе сравнение «с прошлым
          периодом» невозможно прочитать однозначно. */}
      <p className="text-muted-foreground -mt-3 text-xs">
        {formatDate(range.current.gte)} — {formatDate(range.current.lte)}
      </p>

      <InsightList insights={insights} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Banknote}
          label={t('metrics.revenue')}
          value={fmtTJS(sales.netRevenue)}
          hint={t('metrics.revenueHint', {
            sales: fmtTJS(sales.saleRevenue),
            debts: fmtTJS(sales.debtIssued),
          })}
          comparison={sales.comparison.netRevenue}
          to="/transactions"
        />
        <MetricCard
          icon={Receipt}
          label={t('metrics.transactions')}
          value={sales.transactionCount}
          hint={t('metrics.transactionsHint', { sales: sales.saleCount, debts: sales.debtCount })}
          comparison={sales.comparison.transactionCount}
          to="/transactions"
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
          to="/transactions?type=REFUND"
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <RevenueTrendChart data={overview.revenueTrend} />
        <OverdueAlertCard debts={debts} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <PaymentDistributionChart data={overview.paymentMix} />
        <Panel title={t('stockSummary')} className="space-y-3 lg:col-span-2">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Link
              to="/products"
              className="bg-muted/50 hover:bg-muted/80 flex flex-col gap-0.5 rounded-lg p-2 transition-colors sm:p-3">
              <span className="flex items-center gap-1 font-mono text-sm font-bold sm:gap-1.5 sm:text-xl">
                <Package className="text-muted-foreground hidden h-4 w-4 sm:block" />
                {inventory.totalProducts}
              </span>
              <span className="text-muted-foreground truncate text-[10px] sm:text-[11px]">
                {t('inventory.total')}
              </span>
            </Link>
            <Link
              to="/products?needsReorder=true"
              className="bg-muted/50 hover:bg-muted/80 flex flex-col gap-0.5 rounded-lg p-2 transition-colors sm:p-3">
              <span className="text-warning font-mono text-sm font-bold sm:text-xl">{inventory.needsReorder}</span>
              <span className="text-muted-foreground truncate text-[10px] sm:text-[11px]">
                {t('inventory.toOrder')}
              </span>
            </Link>
            <Link
              to="/products?health=HEALTHY"
              className="bg-muted/50 hover:bg-muted/80 flex flex-col gap-0.5 rounded-lg p-2 transition-colors sm:p-3">
              <span className="text-success font-mono text-sm font-bold sm:text-xl">{inventory.healthy}</span>
              <span className="text-muted-foreground truncate text-[10px] sm:text-[11px]">
                {t('inventory.healthy')}
              </span>
            </Link>
            <div className="bg-muted/50 flex flex-col gap-0.5 rounded-lg p-2 sm:p-3">
              <span className="truncate font-mono text-sm font-bold sm:text-xl">{fmtTJS(sales.discountAmount)}</span>
              <span className="text-muted-foreground truncate text-[10px] sm:text-[11px]">
                {t('metrics.discounts')}
              </span>
            </div>
          </div>
          {!user?.marketId && (
            /* ADMIN без своего рынка видит сводку по всем рынкам, поэтому
               ссылка на управление рынками имеет смысл только здесь. */
            <Button variant="ghost" size="sm" className="gap-1 text-xs" render={<Link to="/markets" />}>
              {t('allMarkets')} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </Panel>
      </div>
    </div>
  );
}
