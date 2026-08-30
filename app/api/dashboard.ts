import { apiClient } from '~/lib/client';
import { computeOverviewOffline } from '~/lib/offline/offlineOverview';
import { getIsOnline } from '~/lib/offline/networkStatus';
import type { DashboardResponse, OverviewResponse, SellersReportResponse } from '~/types/dashboard';

const isOffline = (): boolean => !getIsOnline();

export interface DashboardParams {
  period?: string;
  sellerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const dashboardApi = {
  /**
   * Business control centre: sales, debts, returns, inventory health and
   * recommendations in one round-trip.
   */
  getOverview: async (params?: DashboardParams): Promise<OverviewResponse> => {
    if (isOffline()) {
      const data = await computeOverviewOffline(params ?? {});
      return { success: true, data, timestamp: new Date().toISOString() };
    }
    const { data } = await apiClient.get('/dashboard/overview', { params });
    return data;
  },
  get: async (params?: DashboardParams): Promise<DashboardResponse> => {
    const { data } = await apiClient.get('/dashboard', { params });
    return data;
  },
  getSellersReport: async (params?: DashboardParams): Promise<SellersReportResponse> => {
    const { data } = await apiClient.get('/dashboard/sellers-report', { params });
    return data;
  },
};
