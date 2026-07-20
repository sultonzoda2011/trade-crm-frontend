import { createTableStore } from '~/store/useTableStore';
import { createModalStore } from '~/store/createModalStore';

export const useStudentsStore = createTableStore();

type StudentModals = {
  delete: number;
};

export const useStudentsModals = createModalStore<StudentModals>(['delete']);
