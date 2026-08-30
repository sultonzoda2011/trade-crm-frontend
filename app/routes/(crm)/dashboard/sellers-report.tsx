import { useQuery } from '@tanstack/react-query';
import type { Row } from '@tanstack/react-table';
import { Banknote, RefreshCw, ShoppingCart, User, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useOutletContext } from 'react-router';
import { dashboardApi, type DashboardParams } from '~/api/dashboard';
import { DataTable } from '~/components/shared/DataTable';
import { EntityMobileCard } from '~/components/shared/EntityMobileCard';
import { StatCard } from '~/components/shared/StatCard';
import { Skeleton } from '~/components/ui/skeleton';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { useDataTable } from '~/hooks/useDataTable';
import { getClientUser } from '~/lib/auth-utils';
import { fmtTJS } from '~/lib/format';
import { getColumns } from '~/routes/(crm)/dashboard/configs/columns';
import type { SellerReportRow } from '~/types/dashboard';
import type { DashboardFilters } from './layout';

export default function SellersReportPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const { period, sellerId } = useOutletContext<DashboardFilters>();
  const location = useLocation();

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

  // Эндпоинт отчёта отдаёт все строки одним массивом, серверной пагинации у
  // него нет — нарезаем страницы на клиенте. Раньше пагинации не было вообще:
  // единственная таблица в приложении, где список рос без ограничения.
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const totalPages = Math.max(1, Math.ceil(rows.length / limit));
  const currentPage = Math.min(page, totalPages);

  const pageRows = useMemo(
    () => rows.slice((currentPage - 1) * limit, currentPage * limit),
    [rows, currentPage, limit]
  );

  const { table } = useDataTable({
    columns,
    data: pageRows,
    storageKey: 'sellers-report-columns',
  });

  const renderMobileCard = (row: Row<SellerReportRow>) => {
    const report = row.original;
    const seller = report.seller;

    return (
      <EntityMobileCard
        image={seller?.image ?? null}
        fallbackIcon={User}
        title={seller?.name ?? '—'}
        subtitle={seller?.email}
        stats={[
          { icon: ShoppingCart, label: t('table.salesCount'), value: report.salesCount ?? 0 },
          { label: t('table.salesAmount'), value: fmtTJS(report.salesAmount), valueClassName: 'text-success' },
          { icon: RefreshCw, label: t('table.refundsCount'), value: report.refundsCount ?? 0 },
          { label: t('table.refundsAmount'), value: fmtTJS(report.refundsAmount), valueClassName: 'text-destructive' },
          { icon: Banknote, label: t('table.debtsCount'), value: report.debtsCount ?? 0 },
          { label: t('table.debtsAmount'), value: fmtTJS(report.debtsAmount), valueClassName: 'text-warning' },
        ]}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
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
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label={t('table.seller')} value={summary.sellers} />

        <StatCard
          icon={ShoppingCart}
          label={t('table.salesAmount')}
          value={fmtTJS(summary.salesAmount)}
          valueClassName="text-success"
          iconClassName="bg-success/10 text-success"
        />

        <StatCard
          icon={RefreshCw}
          label={t('table.refundsAmount')}
          value={fmtTJS(summary.refundsAmount)}
          valueClassName="text-destructive"
          iconClassName="bg-destructive/10 text-destructive"
        />

        <StatCard
          icon={Banknote}
          label={t('table.debtsAmount')}
          value={fmtTJS(summary.debtsAmount)}
          valueClassName="text-warning"
          iconClassName="bg-warning/10 text-warning"
        />
      </div>

      <DataTable
        table={table}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        pinLastColumn
        page={currentPage}
        limit={limit}
        totalPages={totalPages}
        onPageChange={setPage}
        onLimitChange={(size) => {
          setLimit(size);
          setPage(1);
        }}
        renderMobileCard={renderMobileCard}
        getRowLink={(row) =>
          row.original.seller && canViewSellers
            ? {
                to: `/sellers/${row.original.seller.id}`,
                state: { fromPath: location.pathname, fromName: t('usersReport') },
              }
            : undefined
        }
      />
    </div>
  );
}
