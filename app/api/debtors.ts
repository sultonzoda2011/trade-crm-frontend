import { deleteRequest, detailRequest, jsonWrites, listRequest, nestedDetailRequest } from '~/api/crud';
import type { DebtorDetailResponse, DebtorFullResponse, DebtorRequest, DebtorsResponse } from '~/types/debtors';

const BASE = '/debtors';

export const debtorsApi = {
  getAll: listRequest<DebtorsResponse>(BASE),
  getById: detailRequest<DebtorDetailResponse>(BASE),
  getFull: nestedDetailRequest<DebtorFullResponse>(BASE),
  delete: deleteRequest(BASE),
  ...jsonWrites<DebtorRequest>(BASE),
};
