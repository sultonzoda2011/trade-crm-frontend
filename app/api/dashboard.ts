import { apiClient } from '~/lib/client';
import type { DashboardResponse, SellersReportResponse } from '~/types/dashboard';

export const dashboardApi = {
  get: async (): Promise<DashboardResponse> => {
    const { data } = await apiClient.get('/dashboard');
    return data;
  },
  getSellersReport: async (params?: { dateFrom?: string; dateTo?: string }): Promise<SellersReportResponse> => {
    const { data } = await apiClient.get('/dashboard/sellers-report', { params });
    return data;
  },
};
