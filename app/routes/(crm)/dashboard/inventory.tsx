import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { QueryFallback } from '~/components/dashboard/QueryFallback';
import { ReturnsPanel } from '~/components/dashboard/ReturnsPanel';
import { StockHealth } from '~/components/dashboard/StockHealth';
import { StockOrderList } from '~/components/dashboard/StockOrderList';
import { Reveal } from '~/components/shared/Reveal';
import { Skeleton } from '~/components/ui/skeleton';
import { useNetworkStatus } from '~/hooks/useNetworkStatus';
import { useStockOverview } from '~/hooks/useStockOverview';
import { formatDate } from '~/lib/format';

function InventorySkeleton() {
  return (
    <div className="space-y-5 md:space-y-6">
      <Skeleton className="h-96 rounded-2xl" />
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    </div>
  );
}

/**
 * The Inventory tab: what to order, what state the shelves are in, what comes back.
 *
 * Everything here is "as of now, for the whole shop", counted over the fixed
 * trailing window the Overview's stock card uses (one shared query), so the two
 * tabs cannot tell different stories. That is also why the period and seller
 * filters are hidden on this tab: they would change nothing, and controls that
 * do nothing teach the owner not to trust the ones that do.
 */
export default function DashboardInventoryPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const isOnline = useNetworkStatus();
  const query = useStockOverview();
  const data = query.data?.data;

  if (!data) {
    if (query.isError || query.fetchStatus === 'paused') {
      return (
        <QueryFallback isError={query.isError} isOffline={query.fetchStatus === 'paused'} onRetry={() => query.refetch()} />
      );
    }
    return <InventorySkeleton />;
  }

  // The backend states how many days of stock make a product "slow-moving" in its own
  // recommendation; no such recommendation means no product is slow-moving.
  const slowMovingParam = data.insights.find((insight) => insight.id === 'inventory.slowMoving')?.params.days;
  const slowMovingDays = typeof slowMovingParam === 'number' ? slowMovingParam : undefined;

  return (
    <div className="space-y-5 md:space-y-6">
      {!isOnline && (
        <p className="text-muted-foreground flex items-center gap-2 px-1 text-sm">
          <WifiOff className="size-4 shrink-0" />
          {t('offline.dataFrom', { time: formatDate(new Date(query.dataUpdatedAt), true) })}
        </p>
      )}

      <Reveal index={0}>
        <StockOrderList data={data} />
      </Reveal>

      <div className="grid items-start gap-5 lg:grid-cols-2 lg:gap-6">
        <Reveal index={1}>
          <StockHealth inventory={data.inventory} slowMovingDays={slowMovingDays} />
        </Reveal>
        <Reveal index={2}>
          <ReturnsPanel returns={data.returns} />
        </Reveal>
      </div>
    </div>
  );
}
