import { apiClient } from '~/lib/client';
import type { DashboardResponse, SellersReportResponse } from '~/types/dashboard';

export interface DashboardParams {
  period?: string;
  sellerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const dashboardApi = {
  get: async (params?: DashboardParams): Promise<DashboardResponse> => {
    const { data } = await apiClient.get('/dashboard', { params });
    return data;
  },
  getSellersReport: async (params?: DashboardParams): Promise<SellersReportResponse> => {
    const { data } = await apiClient.get('/dashboard/sellers-report', { params });
    return data;
  },
};
