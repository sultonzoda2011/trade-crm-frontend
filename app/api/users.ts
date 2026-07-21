import { apiClient } from '~/lib/client';
import { filtersToParams } from '~/lib/filtersToParams';
import type { ActiveFilter } from '~/types/filters';
import type { CreateUserRequest, UserDetailResponse, UserRequest, UsersResponse } from '~/types/users';

export const usersApi = {
  getAll: async (page = 1, limit = 20, filters: ActiveFilter[] = []): Promise<UsersResponse> => {
    const { data } = await apiClient.get('/users', {
      params: {
        page,
        limit,
        ...filtersToParams(filters),
      },
    });

    return data;
  },

  getById: async (id: string): Promise<UserDetailResponse> => {
    const { data } = await apiClient.get(`/users/${id}`);
    return data;
  },
  create: async ({ request }: { request: CreateUserRequest }) => {
    const { data } = await apiClient.post(`/users`, request);
    return data;
  },
  update: async ({ request, id }: { request: UserRequest; id: string }) => {
    const { data } = await apiClient.patch(`/users/${id}`, request);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
