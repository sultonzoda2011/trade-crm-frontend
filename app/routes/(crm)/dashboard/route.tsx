import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, Banknote, ShoppingCart, Store, Users, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { dashboardApi } from '~/api/dashboard';
import { Panel } from '~/components/layout/Panel';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { fmtTJS, formatDate } from '~/lib/format';
import { useCan } from '~/hooks/useCan';

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
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground truncate text-xs">{label}</p>
        <p className="truncate font-mono text-lg font-bold">{value}</p>
      </div>
    </Panel>
  );
}

export default function DashboardRoute() {
  const { t } = useTranslation(['dashboard', 'transactions', 'common']);
  const { user } = useCan();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get(),
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
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title={t('recentTransactions')}
          actions={
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              render={<Link to="/transactions" />}>
              {t('viewAll')} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          }>
          {recentTransactions.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">{t('empty')}</p>
          ) : (
            <div className="divide-y divide-border">
              {recentTransactions.map((tx) => (
                <Link
                  key={tx.id}
                  to={`/transactions/${tx.id}`}
                  className="flex items-center justify-between gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded-md transition-colors">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {tx.debtor?.name ?? tx.market.name}
                      <span className="text-muted-foreground ml-2 font-mono text-xs">#{tx.id.slice(0, 8)}</span>
                    </p>
                    <p className="text-muted-foreground text-xs">{formatDate(tx.createdAt, true)}</p>
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
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              render={<Link to="/debtors" />}>
              {t('viewAll')} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          }>
          {topDebtors.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">{t('empty')}</p>
          ) : (
            <div className="divide-y divide-border">
              {topDebtors.map((debtor) => (
                <Link
                  key={debtor.id}
                  to={`/debtors/${debtor.id}`}
                  className="flex items-center justify-between gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded-md transition-colors">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{debtor.name}</p>
                    <p className="text-muted-foreground text-xs">{debtor.phone}</p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-warning">{fmtTJS(debtor.totalDebt)}</span>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
