import { isOfflineCapable } from '~/lib/offline/platform';
import { createDebtorOffline, getAllDebtors, getDebtorById } from '@trade-crm/offline-core';
import { getClientUser } from '~/lib/auth-utils';
import { apiClient } from '~/lib/client';
import { filtersToParams } from '~/lib/filtersToParams';
import { getStorage } from '~/lib/offline/storage';
import { useSyncStore } from '~/store/useSyncStore';
import type { Debtor, DebtorDetailResponse, DebtorRequest, DebtorsResponse } from '~/types/debtors';
import type { ActiveFilter } from '~/types/filters';

export const debtorsApi = {
  getAll: async (
    page = 1,
    limit = 20,
    options: { search?: string; dateFrom?: string; dateTo?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {},
    filters: ActiveFilter[] = []
  ): Promise<DebtorsResponse> => {
    if (isOfflineCapable()) {
      const storage = await getStorage();
      const { items, total } = await getAllDebtors<Debtor>(storage, { search: options.search, page, limit });
      return {
        success: true,
        data: { data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } },
        timestamp: new Date().toISOString(),
      };
    }
    const { data } = await apiClient.get('/debtors', {
      params: { page, limit, ...options, ...filtersToParams(filters) },
    });
    return data;
  },

  getById: async (id: string): Promise<DebtorDetailResponse> => {
    if (isOfflineCapable()) {
      const storage = await getStorage();
      const debtor = await getDebtorById(storage, id);
      if (!debtor) throw new Error(`Debtor ${id} not found locally`);
      return { success: true, data: debtor as any, timestamp: new Date().toISOString() };
    }
    const { data } = await apiClient.get(`/debtors/${id}`);
    return data;
  },

  /** Создание должника разрешено офлайн: пишем локально + кладём в outbox. */
  create: async (request: DebtorRequest) => {
    if (isOfflineCapable()) {
      const storage = await getStorage();
      const marketId = getClientUser()?.marketId ?? '';
      const debtor = await createDebtorOffline(storage, marketId, request);
      await useSyncStore.getState().refreshPendingCount();
      return { success: true, data: debtor, timestamp: new Date().toISOString() };
    }
    const { data } = await apiClient.post(`/debtors`, request);
    return data;
  },
  /** Правка должника — только онлайн (редкая операция, last-write-wins не критичен, но
   *  проще требовать интернет, чем городить merge для одного текстового поля). */
  update: async ({ request, id }: { request: DebtorRequest; id: string }) => {
    const { data } = await apiClient.patch(`/debtors/${id}`, request);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/debtors/${id}`);
  },
};
