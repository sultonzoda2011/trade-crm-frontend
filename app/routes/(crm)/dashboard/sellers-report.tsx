import { useQuery } from '@tanstack/react-query';
import { Banknote, RefreshCw, ShoppingCart, Users } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router';
import { dashboardApi, type DashboardParams } from '~/api/dashboard';
import { Panel } from '~/components/layout/Panel';
import { DataTable } from '~/components/shared/DataTable';
import { Skeleton } from '~/components/ui/skeleton';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { useDataTable } from '~/hooks/useDataTable';
import { getClientUser } from '~/lib/auth-utils';
import { fmtTJS } from '~/lib/format';
import { cn } from '~/lib/utils';
import { getColumns } from '~/routes/(crm)/dashboard/configs/columns';
import type { DashboardFilters } from './layout';

function StatCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <Panel className={cn('flex items-center gap-3 p-4', className)}>
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

export default function SellersReportPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const { period, sellerId } = useOutletContext<DashboardFilters>();

  const params = useMemo(() => {
    const p: DashboardParams = {};
    if (period) p.period = period;
    if (sellerId) p.sellerId = sellerId;
    return p;
  }, [period, sellerId]);

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['sellers-report', params],
    queryFn: () => dashboardApi.getSellersReport(params),
    staleTime: 30_000,
  });

  const rows = useMemo(() => data?.data ?? [], [data]);

  const summary = useMemo(() => {
    const totals = { sellers: 0, salesAmount: 0, refundsAmount: 0, debtsAmount: 0 };
    for (const row of rows) {
      if (row.seller) totals.sellers++;
      totals.salesAmount += row.salesAmount;
      totals.refundsAmount += row.refundsAmount;
      totals.debtsAmount += row.debtsAmount;
    }
    return totals;
  }, [rows]);

  const { can } = useCan();
  const canViewSellers = can(Action.SELLERS_VIEW);
  const currentUserId = useMemo(() => getClientUser()?.id, []);

  const columns = useMemo(() => getColumns({ t, currentUserId, canViewSellers }), [t, currentUserId, canViewSellers]);

  const { table } = useDataTable({
    columns,
    data: rows,
    storageKey: 'sellers-report-columns',
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label={t('table.seller')} value={summary.sellers} />
        <StatCard icon={ShoppingCart} label={t('table.salesAmount')} value={fmtTJS(summary.salesAmount)} />
        <StatCard icon={RefreshCw} label={t('table.refundsAmount')} value={fmtTJS(summary.refundsAmount)} />
        <StatCard icon={Banknote} label={t('table.debtsAmount')} value={fmtTJS(summary.debtsAmount)} />
      </div>

      <DataTable table={table} isLoading={isLoading} isFetching={isFetching} isError={isError} pinLastColumn />
    </div>
  );
}
