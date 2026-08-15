import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router';
import { dashboardApi, type DashboardParams } from '~/api/dashboard';
import { InsightList } from '~/components/dashboard/InsightList';
import { InventoryHealth, ReorderList } from '~/components/dashboard/InventoryHealth';
import { ReturnsPanel } from '~/components/dashboard/ReturnsPanel';
import { Skeleton } from '~/components/ui/skeleton';
import type { DashboardFilters } from './layout';

export default function DashboardInventoryPage() {
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

  // Только инсайты по складу/товарам — про продажи и долги уже есть на "Обзоре".
  const inventoryInsights = useMemo(
    () => overview?.insights.filter((insight) => insight.category === 'inventory') ?? [],
    [overview?.insights]
  );

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
          <Skeleton key={i} className="h-72 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <InsightList insights={inventoryInsights} />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <ReorderList products={overview.products.reorder} />
        <InventoryHealth inventory={overview.inventory} />
        <ReturnsPanel returns={overview.returns} />
      </div>
    </div>
  );
}
