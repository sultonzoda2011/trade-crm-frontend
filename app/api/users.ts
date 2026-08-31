import { isOfflineCapable } from '~/lib/offline/platform';
import { getAllUsers, getUserById } from '@trade-crm/offline-core';
import { apiClient } from '~/lib/client';
import { filtersToParams } from '~/lib/filtersToParams';
import { getStorage } from '~/lib/offline/storage';
import type { ActiveFilter } from '~/types/filters';
import type { UserDetailResponse, UsersResponse } from '~/types/users';

export const usersApi = {
  getAll: async (
    page = 1,
    limit = 20,
    options: { search?: string; dateFrom?: string; dateTo?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {},
    filters: ActiveFilter[] = []
  ): Promise<UsersResponse> => {
    if (isOfflineCapable()) {
      const storage = await getStorage();
      const { items, total } = await getAllUsers(storage, { search: options.search, page, limit });
      return {
        success: true,
        data: { data: items as any, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } },
        timestamp: new Date().toISOString(),
      };
    }
    const { data } = await apiClient.get('/users', {
      params: { page, limit, ...options, ...filtersToParams(filters) },
    });
    return data;
  },

  getById: async (id: string): Promise<UserDetailResponse> => {
    if (isOfflineCapable()) {
      const storage = await getStorage();
      const user = await getUserById(storage, id);
      if (!user) throw new Error(`User ${id} not found locally`);
      return { success: true, data: user as any, timestamp: new Date().toISOString() };
    }
    const { data } = await apiClient.get(`/users/${id}`);
    return data;
  },
  /** Создание/правка пользователя — только онлайн (управление доступом, редкая операция). */
  create: async (formData: FormData) => {
    const { data } = await apiClient.post('/users', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  update: async ({ formData, id }: { formData: FormData; id: string }) => {
    const { data } = await apiClient.patch(`/users/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
