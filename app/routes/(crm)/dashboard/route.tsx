import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, Banknote, Package, Receipt, ShoppingCart, Undo2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useOutletContext } from 'react-router';
import { dashboardApi, type DashboardParams } from '~/api/dashboard';
import { CategoryPerformance } from '~/components/dashboard/CategoryPerformance';
import { InsightList } from '~/components/dashboard/InsightList';
import { InventoryHealth, ReorderList } from '~/components/dashboard/InventoryHealth';
import { MetricCard } from '~/components/dashboard/MetricCard';
import { OverdueAlertCard } from '~/components/dashboard/OverdueAlertCard';
import { PaymentDistributionChart } from '~/components/dashboard/PaymentDistributionChart';
import { ReturnsPanel } from '~/components/dashboard/ReturnsPanel';
import { RevenueTrendChart } from '~/components/dashboard/RevenueTrendChart';
import { Panel } from '~/components/layout/Panel';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { useCan } from '~/hooks/useCan';
import { fmtTJS, formatDate } from '~/lib/format';
import type { ProductLeaderRow } from '~/types/dashboard';
import type { DashboardFilters } from './layout';

/**
 * Топ товаров периода: чистые единицы и чистая выручка, уже за вычетом
 * возвратов — иначе «лидер продаж» мог бы оказаться товаром, который
 * массово возвращают.
 */
function TopProducts({ products, title }: { products: ProductLeaderRow[]; title: string }) {
  const { t } = useTranslation('dashboard');

  return (
    <Panel
      title={title}
      className="p-0"
      actions={
        <Button variant="ghost" size="sm" className="gap-1 text-xs" render={<Link to="/products" />}>
          {t('viewAll')} <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      }>
      {products.length === 0 ? (
        <p className="text-muted-foreground px-4 py-6 text-sm">{t('empty')}</p>
      ) : (
        <div className="divide-border divide-y">
          {products.map((product, index) => (
            <Link
              key={product.productId}
              to={`/products/${product.productId}`}
              className="hover:bg-muted/40 flex items-center justify-between gap-3 px-4 py-2.5 transition-colors">
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="text-muted-foreground w-4 shrink-0 font-mono text-xs">{index + 1}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{product.productName}</span>
                  <span className="text-muted-foreground block text-xs">
                    {t('products.netUnits', { count: product.netUnits })}
                    {product.refundedUnits > 0 && (
                      <span className="text-destructive ml-1.5">
                        −{product.refundedUnits} {t('products.returned')}
                      </span>
                    )}
                  </span>
                </span>
              </span>
              <span className="shrink-0 font-mono text-sm font-semibold">{fmtTJS(product.netRevenue)}</span>
            </Link>
          ))}
        </div>
      )}
    </Panel>
  );
}

export default function DashboardRoute() {
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
      <div className="flex flex-1 items-center justify-center">
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
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const { sales, debts, returns, inventory, products, categories, insights, period: range } = overview;

  return (
    <div className="flex flex-1 flex-col space-y-6 pb-8">
      {/* Какой именно отрезок сейчас на экране — иначе сравнение «с прошлым
          периодом» невозможно прочитать однозначно. Период/продавец уже
          выбираются в шапке дашборда (DashboardLayout), здесь только диапазон дат. */}
      <p className="text-muted-foreground text-xs">
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

      <div className="grid gap-6 lg:grid-cols-3">
        <RevenueTrendChart data={overview.revenueTrend} />
        <OverdueAlertCard debts={debts} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ReorderList products={products.reorder} />
        <InventoryHealth inventory={inventory} />
        <ReturnsPanel returns={returns} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <TopProducts products={products.topByRevenue} title={t('products.topByRevenue')} />
        <TopProducts products={products.topByUnits} title={t('products.topByUnits')} />
        <CategoryPerformance categories={categories} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <PaymentDistributionChart data={overview.paymentMix} />
        <Panel title={t('stockSummary')} className="space-y-3 lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link
              to="/products"
              className="bg-muted/50 hover:bg-muted/80 flex flex-col gap-0.5 rounded-lg p-3 transition-colors">
              <span className="flex items-center gap-1.5 font-mono text-xl font-bold">
                <Package className="text-muted-foreground h-4 w-4" />
                {inventory.totalProducts}
              </span>
              <span className="text-muted-foreground text-2xs">{t('inventory.total')}</span>
            </Link>
            <Link
              to="/products?needsReorder=true"
              className="bg-muted/50 hover:bg-muted/80 flex flex-col gap-0.5 rounded-lg p-3 transition-colors">
              <span className="text-warning font-mono text-xl font-bold">{inventory.needsReorder}</span>
              <span className="text-muted-foreground text-2xs">{t('inventory.toOrder')}</span>
            </Link>
            <Link
              to="/products?health=HEALTHY"
              className="bg-muted/50 hover:bg-muted/80 flex flex-col gap-0.5 rounded-lg p-3 transition-colors">
              <span className="text-success font-mono text-xl font-bold">{inventory.healthy}</span>
              <span className="text-muted-foreground text-2xs">{t('inventory.healthy')}</span>
            </Link>
            <div className="bg-muted/50 flex flex-col gap-0.5 rounded-lg p-3">
              <span className="font-mono text-xl font-bold">{fmtTJS(sales.discountAmount)}</span>
              <span className="text-muted-foreground text-2xs">{t('metrics.discounts')}</span>
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
