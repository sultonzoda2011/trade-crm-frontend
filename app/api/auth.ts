import { apiClient } from '~/lib/client';
import type { LoginResponse } from '~/types/auth';
import type { LoginForm } from '~/validations/auth';

export const authApi = {
  login: async (payload: LoginForm): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
    return data;
  },
};
