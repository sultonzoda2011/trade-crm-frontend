import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, Banknote, ShoppingCart, Store, Users, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { dashboardApi, type DashboardParams } from '~/api/dashboard';
import { sellersApi } from '~/api/sellers';
import { Panel } from '~/components/layout/Panel';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { CustomSelect } from '~/components/shared/CustomSelect';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Skeleton } from '~/components/ui/skeleton';
import { fmtTJS, formatDate } from '~/lib/format';
import { mapToOptions } from '~/lib/mapToOptions';
import { useCan } from '~/hooks/useCan';
import { RevenueTrendChart } from '~/components/dashboard/RevenueTrendChart';
import { PaymentDistributionChart } from '~/components/dashboard/PaymentDistributionChart';
import { OverdueAlertCard } from '~/components/dashboard/OverdueAlertCard';

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <Panel className="flex items-center gap-3 p-4">
      <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground truncate text-xs">{label}</p>
        <p className="truncate font-mono text-lg font-bold">{value}</p>
      </div>
    </Panel>
  );
}

const PERIOD_OPTIONS = [
  { value: 'today', labelKey: 'period.today' },
  { value: 'week', labelKey: 'period.week' },
  { value: 'month', labelKey: 'period.month' },
  { value: 'year', labelKey: 'period.year' },
] as const;

export default function DashboardRoute() {
  const { t } = useTranslation(['dashboard', 'transactions', 'common']);
  const { user } = useCan();
  const [period, setPeriod] = useState('month');
  const [sellerId, setSellerId] = useState<string | undefined>(undefined);

  const { data: sellersResponse } = useQuery({
    queryKey: ['sellers', 'list'],
    queryFn: () => sellersApi.getAll(1, 100, {}, []),
    staleTime: 60_000,
  });

  const sellerOptions = useMemo(() => mapToOptions(sellersResponse?.data?.data ?? [], 'id', 'name'), [sellersResponse]);

  const params = useMemo(() => {
    const p: DashboardParams = {};
    if (period) p.period = period;
    if (sellerId) p.sellerId = sellerId;
    return p;
  }, [period, sellerId]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['dashboard', params],
    queryFn: () => dashboardApi.get(params),
    staleTime: 30_000,
  });

  const dashboard = data?.data;

  if (isLoading || !dashboard) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  const { stats, recentTransactions, topDebtors } = dashboard;

  return (
    <div className="flex flex-1 flex-col space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs">{t('period.from')}</Label>
            <CustomSelect
              options={PERIOD_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
              value={period}
              onChange={(v) => setPeriod(String(v))}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">{t('seller')}</Label>
            <CustomSelect
              options={[{ value: '', label: t('viewAll') }, ...sellerOptions]}
              value={sellerId ?? ''}
              onChange={(v) => setSellerId(v ? String(v) : undefined)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {!user?.marketId && <StatCard icon={Store} label={t('stats.totalMarkets')} value={stats.totalMarkets} />}
        {!user?.marketId && <StatCard icon={Users} label={t('stats.totalUsers')} value={stats.totalUsers} />}
        <StatCard icon={Users} label={t('stats.totalDebtors')} value={stats.totalDebtors} />
        <StatCard icon={AlertTriangle} label={t('stats.activeDebts')} value={stats.activeDebts} />
        <StatCard icon={Wallet} label={t('stats.totalDebtAmount')} value={fmtTJS(stats.totalDebtAmount)} />
        <StatCard icon={Banknote} label={t('stats.totalSaleAmount')} value={fmtTJS(stats.totalSaleAmount)} />
        <StatCard icon={ShoppingCart} label={t('stats.todayTransactions')} value={stats.todayTransactions} />
      </div>

      {/* Analytics Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {dashboard.revenueTrend && <RevenueTrendChart data={dashboard.revenueTrend} />}
        {dashboard.paymentDistribution && <PaymentDistributionChart data={dashboard.paymentDistribution} />}
      </div>

      {/* Alerts */}
      <div className="grid gap-6">
        <OverdueAlertCard debtors={topDebtors} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title={t('recentTransactions')}
          actions={
            <Button variant="ghost" size="sm" className="gap-1 text-xs" render={<Link to="/transactions" />}>
              {t('viewAll')} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          }>
          {recentTransactions.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">{t('empty')}</p>
          ) : (
            <div className="divide-border divide-y">
              {recentTransactions.map((tx) => (
                <Link
                  key={tx.id}
                  to={`/transactions/${tx.id}`}
                  className="hover:bg-muted/40 -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-3 transition-colors">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar size="sm" className="shrink-0">
                      {tx.createdBy.image ? <AvatarImage src={tx.createdBy.image} alt={tx.createdBy.name} /> : null}
                      <AvatarFallback>{tx.createdBy.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {tx.debtor?.name ?? tx.market.name}
                        <span className="text-muted-foreground ml-2 font-mono text-xs">#{tx.id.slice(0, 8)}</span>
                      </p>
                      <p className="text-muted-foreground text-xs">{formatDate(tx.createdAt, true)}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        tx.type === 'DEBT'
                          ? 'border-warning/40 bg-warning/15 text-warning'
                          : tx.type === 'REFUND'
                            ? 'border-destructive/40 bg-destructive/15 text-destructive'
                            : 'border-success/40 bg-success/15 text-success'
                      }>
                      {t(`type.${tx.type}`, { ns: 'transactions', defaultValue: tx.type })}
                    </Badge>
                    <span className="font-mono text-sm font-semibold">{fmtTJS(tx.totalAmount)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title={t('topDebtors')}
          actions={
            <Button variant="ghost" size="sm" className="gap-1 text-xs" render={<Link to="/debtors" />}>
              {t('viewAll')} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          }>
          {topDebtors.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">{t('empty')}</p>
          ) : (
            <div className="divide-border divide-y">
              {topDebtors.map((debtor) => (
                <Link
                  key={debtor.id}
                  to={`/debtors/${debtor.id}`}
                  className="hover:bg-muted/40 -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-3 transition-colors">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{debtor.name}</p>
                    <p className="text-muted-foreground text-xs">{debtor.phone}</p>
                  </div>
                  <span className="text-warning font-mono text-sm font-semibold">{fmtTJS(debtor.totalDebt)}</span>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
