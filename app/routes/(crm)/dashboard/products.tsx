import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router';
import { dashboardApi, type DashboardParams } from '~/api/dashboard';
import { CategoryPerformance } from '~/components/dashboard/CategoryPerformance';
import { TopProducts } from '~/components/dashboard/TopProducts';
import { Skeleton } from '~/components/ui/skeleton';
import type { DashboardFilters } from './layout';

export default function DashboardProductsPage() {
  const { t } = useTranslation('dashboard');
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
      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-80 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-3">
      <TopProducts products={overview.products.topByRevenue} title={t('products.topByRevenue')} />
      <TopProducts products={overview.products.topByUnits} title={t('products.topByUnits')} />
      <CategoryPerformance categories={overview.categories} />
    </div>
  );
}
