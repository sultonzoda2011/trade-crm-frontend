import { createModalStore } from '~/store/createModalStore';
import { createTableStore } from '~/store/useTableStore';
import type { User } from '~/types/users';

export const useUsersStore = createTableStore();

type UsersModals = {
  delete: string;
  create: null;
  edit: User;
};

export const useUsersModals = createModalStore<UsersModals>(['delete', 'create', 'edit']);
