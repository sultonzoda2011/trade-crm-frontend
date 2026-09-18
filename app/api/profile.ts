import { apiClient } from '~/lib/client';
import type { ProfileFullResponse, ProfileResponse, UpdatePasswordRequest } from '~/types/profile';

export const profileApi = {
  getProfile: async (): Promise<ProfileResponse> => {
    const { data } = await apiClient.get<ProfileResponse>('/profile');
    return data;
  },

  getFullProfile: async (): Promise<ProfileFullResponse> => {
    const { data } = await apiClient.get<ProfileFullResponse>('/profile/full');
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
