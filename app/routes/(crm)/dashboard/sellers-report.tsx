import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Banknote, RefreshCw, ShoppingCart, Store, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { dashboardApi, type DashboardParams } from '~/api/dashboard';
import { sellersApi } from '~/api/sellers';
import { Panel } from '~/components/layout/Panel';
import { CustomSelect } from '~/components/shared/CustomSelect';
import { DateInputField } from '~/components/shared/DateInputField';
import { DataTable } from '~/components/shared/DataTable';
import { Label } from '~/components/ui/label';
import { Skeleton } from '~/components/ui/skeleton';
import { useDataTable } from '~/hooks/useDataTable';
import { fmtTJS } from '~/lib/format';
import { mapToOptions } from '~/lib/mapToOptions';
import { cn } from '~/lib/utils';
import { getColumns } from './configs/columns';

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

const PERIOD_OPTIONS = [
  { value: 'today', labelKey: 'period.today' },
  { value: 'week', labelKey: 'period.week' },
  { value: 'month', labelKey: 'period.month' },
  { value: 'year', labelKey: 'period.year' },
] as const;

export default function SellersReportPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const [period, setPeriod] = useState('month');
  const [sellerId, setSellerId] = useState<string | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState(() => dayjs().startOf('month').format('YYYY-MM-DD'));
  const [dateTo, setDateTo] = useState(() => dayjs().format('YYYY-MM-DD'));

  const { data: sellersResponse } = useQuery({
    queryKey: ['sellers', 'list'],
    queryFn: () => sellersApi.getAll(1, 100, {}, []),
    staleTime: 60_000,
  });

  const sellerOptions = useMemo(
    () => mapToOptions(sellersResponse?.data?.data ?? [], 'id', 'name'),
    [sellersResponse],
  );

  const params = useMemo(() => {
    const p: DashboardParams = {};
    if (period) p.period = period;
    if (!period) {
      if (dateFrom) p.dateFrom = dateFrom;
      if (dateTo) p.dateTo = dateTo;
    }
    if (sellerId) p.sellerId = sellerId;
    return p;
  }, [period, sellerId, dateFrom, dateTo]);

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

  const columns = useMemo(() => getColumns({ t }), [t]);

  const { table } = useDataTable({
    columns,
    data: rows,
    storageKey: 'sellers-report-columns',
  });

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4">
        <Skeleton className="h-8 w-48" />
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
    <div className="flex-1 space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold">{t('sellersReport')}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label={t('table.seller')} value={summary.sellers} />
        <StatCard icon={ShoppingCart} label={t('table.salesAmount')} value={fmtTJS(summary.salesAmount)} />
        <StatCard icon={RefreshCw} label={t('table.refundsAmount', { defaultValue: 'Сумма возвратов' })} value={fmtTJS(summary.refundsAmount)} />
        <StatCard icon={Banknote} label={t('table.debtsAmount')} value={fmtTJS(summary.debtsAmount)} />
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-xs">{t('period.from')}</Label>
          <CustomSelect
            options={PERIOD_OPTIONS.map(o => ({ value: o.value, label: t(o.labelKey) }))}
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
        {!period && (
          <>
            <DateInputField
              label={t('period.from')}
              value={dateFrom}
              onChange={(date) => setDateFrom(date ?? '')}
            />
            <DateInputField
              label={t('period.to')}
              value={dateTo}
              onChange={(date) => setDateTo(date ?? '')}
            />
          </>
        )}
      </div>

      <DataTable
        table={table}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        pinLastColumn
      />
    </div>
  );
}
