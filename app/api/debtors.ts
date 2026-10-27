import { deleteRequest, detailRequest, idempotencyConfig, listRequest, nestedDetailRequest } from '~/api/crud';
import { apiClient } from '~/lib/client';
import type {
  DebtorDetailResponse,
  DebtorFullResponse,
  DebtorLedgerResponse,
  DebtorPaymentRequest,
  DebtorPaymentResponse,
  DebtorRequest,
  DebtorsResponse,
  DebtorsSummaryResponse,
} from '~/types/debtors';

const BASE = '/debtors';

export const debtorsApi = {
  getAll: listRequest<DebtorsResponse>(BASE),
  getById: detailRequest<DebtorDetailResponse>(BASE),
  getFull: nestedDetailRequest<DebtorFullResponse>(BASE),
  delete: deleteRequest(BASE),

  getSummary: async (): Promise<DebtorsSummaryResponse> => {
    const { data } = await apiClient.get(`${BASE}/summary`);
    return data;
  },

  getLedger: async (id: string, page = 1, limit = 30): Promise<DebtorLedgerResponse> => {
    const { data } = await apiClient.get(`${BASE}/${id}/ledger`, { params: { page, limit } });
    return data;
  },

  // Оплата суммой: бэкенд раскладывает её по долгам от старых к новым. Только онлайн — в офлайн-очереди
  // остаётся оплата по одной транзакции (см. app/lib/offline-mutations.ts).
  pay: async (id: string, request: DebtorPaymentRequest, idempotencyKey?: string): Promise<DebtorPaymentResponse> => {
    // Без `silent`, как у idempotencyConfig: ошибка («сумма больше долга») должна показаться тостом.
    const { data } = await apiClient.post(
      `${BASE}/${id}/payments`,
      request,
      idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined
    );
    return data;
  },

  remind: async (id: string) => {
    const { data } = await apiClient.post(`${BASE}/${id}/remind`);
    return data;
  },

  update: async ({ request, id }: { request: DebtorRequest; id: string }) => {
    const { data } = await apiClient.patch(`${BASE}/${id}`, request);
    return data;
  },

  // create получает второй, необязательный `idempotencyKey`: должника можно завести без
  // связи (очередь, см. app/lib/offline-mutations.ts), и повторная отправка после обрыва
  // не должна создавать двойника — бэкенд дедуплицирует по этому ключу.
  create: async (request: DebtorRequest, idempotencyKey?: string): Promise<DebtorDetailResponse> => {
    const { data } = await apiClient.post(BASE, request, idempotencyConfig(idempotencyKey));
    return data;
  },
};
