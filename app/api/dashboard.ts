import type { AxiosRequestConfig } from 'axios';
import { STOCK_ANALYSIS_DAYS } from '~/config/dashboard';
import { apiClient } from '~/lib/client';
import { getRollingDateParams } from '~/lib/date';
import type { OverviewResponse, SellersReportResponse } from '~/types/dashboard';

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
  getOverview: async (params?: DashboardParams, config?: AxiosRequestConfig): Promise<OverviewResponse> => {
    const { data } = await apiClient.get('/dashboard/overview', { ...config, params });
    return data;
  },
  /**
   * The same endpoint, read over a fixed trailing window instead of the period
   * picked in the filter bar. "How long will the stock last" is a statement about
   * the shop's usual pace of sales, so it must not change when the owner flips
   * from "Today" to "Year". Stock is market-wide on the backend, hence no seller.
   * The dates are computed when the request runs (not captured in the query key),
   * so a copy saved on the phone stays addressable tomorrow.
   */
  getStockOverview: async (config?: AxiosRequestConfig): Promise<OverviewResponse> => {
    const { data } = await apiClient.get('/dashboard/overview', {
      ...config,
      params: getRollingDateParams(STOCK_ANALYSIS_DAYS),
    });
    return data;
  },
  getSellersReport: async (params?: DashboardParams, config?: AxiosRequestConfig): Promise<SellersReportResponse> => {
    const { data } = await apiClient.get('/dashboard/sellers-report', { ...config, params });
    return data;
  },
};
