import type { HttpClient } from '@trade-crm/offline-core';
import { apiClient } from '~/lib/client';

/**
 * Мост между offline-core (не знает про axios) и уже существующим
 * apiClient (interceptors: auth token, 401-редирект и т.д. остаются как есть).
 */
export const httpClient: HttpClient = {
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const { data } = await apiClient.get(url, { params });
    return data;
  },
  async post<T>(url: string, body: unknown): Promise<T> {
    const { data } = await apiClient.post(url, body);
    return data;
  },
  async patch<T>(url: string, body: unknown): Promise<T> {
    const { data } = await apiClient.patch(url, body);
    return data;
  },
};
