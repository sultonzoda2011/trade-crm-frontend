import { apiClient } from '~/lib/client';
import type { ApiResponse, ChangeMailRequest, ChangePasswordRequest, LoginResponse, Roles, User } from '~/types/auth';
import type { LoginForm } from '~/validations/auth';

export const authApi = {
  login: async (payload: LoginForm): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/Account/login', payload);
    return data;
  },

  me: async (): Promise<ApiResponse<User>> => {
    const { data } = await apiClient.get<ApiResponse<User>>('/User/me');
    return data;
  },
  roles: async (): Promise<Roles> => {
    const { data } = await apiClient.get<Roles>('Account/roles');
    return data;
  },
  changePassword: async (payload: ChangePasswordRequest): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.put<ApiResponse<null>>('/Account/change-password', payload);
    return data;
  },
  changeMail: async (payload: ChangeMailRequest): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.put<ApiResponse<null>>('/User/change-email', payload);
    return data;
  },
  updateProfilePicture: async (payload: FormData): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.put<ApiResponse<null>>('/User/profile-picture', payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
};
