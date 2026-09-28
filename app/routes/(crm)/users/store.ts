import { createModalStore } from '~/store/createModalStore';
import { createTableStore } from '~/store/useTableStore';

export const useUsersStore = createTableStore();

type UsersModals = {
  delete: string;
};

export const useUsersModals = createModalStore<UsersModals>(['delete']);
