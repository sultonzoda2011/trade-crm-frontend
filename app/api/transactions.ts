import {
  deleteRequest,
  detailRequest,
  idempotencyConfig as idempotencyHeaders,
  listRequest,
  nestedDetailRequest,
} from '~/api/crud';
import { apiClient } from '~/lib/client';
import type {
  CreatePaymentRequest,
  CreateTransactionRequest,
  RefundTransactionRequest,
  TransactionDetailResponse,
  TransactionResponse,
  TransactionsResponse,
} from '~/types/transactions';

const BASE = '/transactions';

export const transactionsApi = {
  getAll: listRequest<TransactionsResponse>(BASE),
  getById: detailRequest<TransactionResponse>(BASE),
  // The enriched payload is called `detail` here, not `full` — the only endpoint that deviates.
  getDetail: nestedDetailRequest<TransactionDetailResponse>(BASE, 'detail'),
  delete: deleteRequest(BASE),

  // create/pay/refund get a second, optional `idempotencyKey` param — the only three
  // endpoints the backend's IdempotencyInterceptor is wired to (see trade-crm-backend).
  // The key is generated once when a mutation is queued offline (app/lib/offline-mutations.ts)
  // and reused on every retry/resume of that same operation, so a replay never double-charges.
  create: async (request: CreateTransactionRequest, idempotencyKey?: string): Promise<TransactionResponse> => {
    const { data } = await apiClient.post(BASE, request, idempotencyHeaders(idempotencyKey));
    return data;
  },

  pay: async (
    { request, id }: { request: CreatePaymentRequest; id: string },
    idempotencyKey?: string
  ): Promise<TransactionResponse> => {
    const { data } = await apiClient.patch(`${BASE}/${id}/pay`, request, idempotencyHeaders(idempotencyKey));
    return data;
  },

  refund: async (
    { id, request }: { id: string; request?: RefundTransactionRequest },
    idempotencyKey?: string
  ): Promise<TransactionDetailResponse> => {
    const { data } = await apiClient.post(`${BASE}/${id}/refund`, request ?? {}, idempotencyHeaders(idempotencyKey));
    return data;
  },
};
