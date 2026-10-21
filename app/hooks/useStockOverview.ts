import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '~/api/dashboard';
import { STOCK_ANALYSIS_DAYS } from '~/config/dashboard';
import { queryKeys } from '~/lib/query-keys';

/**
 * The shop's stock, read over the fixed trailing window (`STOCK_ANALYSIS_DAYS`).
 *
 * One hook for every screen that talks about stock — the "running low" card on
 * the Overview and the whole Inventory tab — so both read the same cache entry:
 * the numbers cannot disagree between tabs, switching tabs does not refetch, and
 * the copy saved on the phone is found again offline.
 *
 * The key carries neither the period nor the seller from the filter bar: stock
 * does not depend on them (the backend counts it for the whole market, and a
 * forecast that changed when the owner flipped "Today" to "Year" would not be a
 * forecast).
 */
export function useStockOverview() {
  return useQuery({
    queryKey: queryKeys.dashboard('stock', { days: STOCK_ANALYSIS_DAYS }),
    queryFn: () => dashboardApi.getStockOverview(),
    staleTime: 5 * 60_000,
  });
}
