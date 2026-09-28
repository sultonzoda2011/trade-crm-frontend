import { deleteRequest, detailRequest, listRequest, multipartWrites, nestedDetailRequest } from '~/api/crud';
import type { UserDetailResponse, UserFullResponse, UsersResponse } from '~/types/users';

const BASE = '/users';

export const usersApi = {
  getAll: listRequest<UsersResponse>(BASE),
  getById: detailRequest<UserDetailResponse>(BASE),
  getFull: nestedDetailRequest<UserFullResponse>(BASE),
  delete: deleteRequest(BASE),
  ...multipartWrites(BASE),
};
