import {
  deleteRequest,
  detailRequest,
  idempotencyConfig,
  jsonWrites,
  listRequest,
  nestedDetailRequest,
} from '~/api/crud';
import { apiClient } from '~/lib/client';
import type {
  DebtorDetailResponse,
  DebtorFullResponse,
  DebtorRequest,
  DebtorsResponse,
} from '~/types/debtors';

const BASE = '/debtors';

export const debtorsApi = {
  getAll: listRequest<DebtorsResponse>(BASE),
  getById: detailRequest<DebtorDetailResponse>(BASE),
  getFull: nestedDetailRequest<DebtorFullResponse>(BASE),
  delete: deleteRequest(BASE),
  ...jsonWrites<DebtorRequest>(BASE),

  // create получает второй, необязательный `idempotencyKey`: должника можно завести без
  // связи (очередь, см. app/lib/offline-mutations.ts), и повторная отправка после обрыва
  // не должна создавать двойника — бэкенд дедуплицирует по этому ключу.
  create: async (request: DebtorRequest, idempotencyKey?: string): Promise<DebtorDetailResponse> => {
    const { data } = await apiClient.post(BASE, request, idempotencyConfig(idempotencyKey));
    return data;
  },
};
