import { createModalStore } from '~/store/createModalStore';
import type { Profile } from '~/types/profile';

type ProfileModals = {
  edit: Profile;
  password: null;
};

export const useProfileModals = createModalStore<ProfileModals>(['edit', 'password']);
