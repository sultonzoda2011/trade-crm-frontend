import type { AxiosRequestConfig } from 'axios';
import { apiClient } from '~/lib/client';
import type {
  ProfileFullResponse,
  ProfileResponse,
  UpdatePasswordRequest,
  UpdatePasswordResponse,
} from '~/types/profile';

/**
 * Формы профиля показывают ошибки сами (под нужным полем, по `code` ответа),
 * поэтому их запросы идут с `silent` — общий перехватчик не рисует свой тост.
 */
export const profileApi = {
  getProfile: async (config?: AxiosRequestConfig): Promise<ProfileResponse> => {
    const { data } = await apiClient.get<ProfileResponse>('/profile', config);
    return data;
  },

  getFullProfile: async (config?: AxiosRequestConfig): Promise<ProfileFullResponse> => {
    const { data } = await apiClient.get<ProfileFullResponse>('/profile/full', config);
    return data;
  },

  updateProfile: async (formData: FormData): Promise<ProfileResponse> => {
    const { data } = await apiClient.patch<ProfileResponse>('/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      silent: true,
    });
    return data;
  },

  removeImage: async (): Promise<ProfileResponse> => {
    const { data } = await apiClient.delete<ProfileResponse>('/profile/image', { silent: true });
    return data;
  },

  updatePassword: async (payload: UpdatePasswordRequest): Promise<UpdatePasswordResponse> => {
    const { data } = await apiClient.patch<UpdatePasswordResponse>('/profile/password', payload, { silent: true });
    return data;
  },
};
