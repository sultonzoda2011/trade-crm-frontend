import type { AxiosRequestConfig } from 'axios';
import {
  deleteRequest,
  detailRequest,
  listRequest,
  multipartWrites,
  nestedDetailRequest,
  type ListOptions,
} from '~/api/crud';
import { apiClient } from '~/lib/client';
import { filtersToParams } from '~/lib/filtersToParams';
import type { ActiveFilter } from '~/types/filters';
import type {
  CreateSellerCreditRequest,
  ResetPasswordResponse,
  SellerBalanceResponse,
  SellerCreditResponse,
  SellerCreditsResponse,
  SellerDetailResponse,
  SellerEarningsResponse,
  SellerFullResponse,
  SellersResponse,
  SellersSummaryResponse,
} from '~/types/sellers';

const BASE = '/sellers';

/** Пока пользователь не выбрал статус, экран «Продавцы» показывает работающих. */
export const DEFAULT_SELLER_STATUS = 'active';

export const sellersApi = {
  /**
   * Плоский список без статистики — для выпадашек «выбрать продавца» (фильтр
   * чеков, дашборд): там нужны и отключённые, у них осталась история.
   */
  getAll: listRequest<SellersResponse>(BASE),
  /**
   * Список экрана «Продавцы»: со статистикой за период и «к выплате». Без выбранного
   * статуса — только работающие. Окно периода выбирают чипсы (`period`); произвольных
   * дат экран не предлагает, поэтому `dateFrom/dateTo` не уходят.
   */
  getList: async (
    page = 1,
    limit = 20,
    options: ListOptions = {},
    filters: ActiveFilter[] = [],
    config?: AxiosRequestConfig
  ): Promise<SellersResponse> => {
    const { dateFrom: _from, dateTo: _to, ...rest } = options;
    const params = { status: DEFAULT_SELLER_STATUS, ...filtersToParams(filters) };
    const { data } = await apiClient.get(BASE, {
      ...config,
      params: { page, limit, withStats: true, ...rest, ...params },
    });
    return data;
  },
  getById: detailRequest<SellerDetailResponse>(BASE),
  getFull: nestedDetailRequest<SellerFullResponse>(BASE),
  delete: deleteRequest(BASE),
  ...multipartWrites(BASE),

  getSummary: async (
    params: { period?: string; status?: string } = {},
    config?: AxiosRequestConfig
  ): Promise<SellersSummaryResponse> => {
    const { data } = await apiClient.get(`${BASE}/summary`, { ...config, params });
    return data;
  },

  deactivate: async (id: string): Promise<SellerDetailResponse> =>
    (await apiClient.post(`${BASE}/${id}/deactivate`)).data,
  activate: async (id: string): Promise<SellerDetailResponse> => (await apiClient.post(`${BASE}/${id}/activate`)).data,
  /** Новый пароль приходит один раз — его надо сразу показать владельцу. */
  resetPassword: async (id: string): Promise<ResetPasswordResponse> =>
    (await apiClient.post(`${BASE}/${id}/reset-password`)).data,

  // Деньги продавца живут в своих под-ресурсах — это не CRUD-форма.
  getBalance: async (id: string): Promise<SellerBalanceResponse> => {
    const { data } = await apiClient.get(`${BASE}/${id}/balance`);
    return data;
  },
  getEarnings: async (id: string, page = 1, limit = 20): Promise<SellerEarningsResponse> => {
    const { data } = await apiClient.get(`${BASE}/${id}/earnings`, { params: { page, limit } });
    return data;
  },
  getCredits: async (id: string, page = 1, limit = 10): Promise<SellerCreditsResponse> => {
    const { data } = await apiClient.get(`${BASE}/${id}/credits`, { params: { page, limit } });
    return data;
  },
  createCredit: async ({
    id,
    request,
  }: {
    id: string;
    request: CreateSellerCreditRequest;
  }): Promise<SellerCreditResponse> => {
    const { data } = await apiClient.post(`${BASE}/${id}/credits`, request);
    return data;
  },
  reverseCredit: async ({
    id,
    creditId,
    note,
  }: {
    id: string;
    creditId: string;
    note?: string;
  }): Promise<SellerCreditResponse> => {
    const { data } = await apiClient.post(`${BASE}/${id}/credits/${creditId}/reverse`, { note });
    return data;
  },
};
