import type { AxiosRequestConfig } from 'axios';
import { apiClient } from '~/lib/client';
import type { ProfileFullResponse, ProfileResponse, UpdatePasswordRequest } from '~/types/profile';

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
    });
    return data;
  },

  updatePassword: async (payload: UpdatePasswordRequest): Promise<void> => {
    await apiClient.patch('/profile/password', payload);
  },
};
