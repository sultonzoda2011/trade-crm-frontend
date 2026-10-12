import { deleteRequest, detailRequest, jsonWrites, listRequest, nestedDetailRequest } from '~/api/crud';
import { apiClient } from '~/lib/client';
import type {
  CreatePaymentRequest,
  CreateTransactionRequest,
  RefundTransactionRequest,
  TransactionDetailResponse,
  TransactionResponse,
  TransactionsResponse,
  UpdateTransactionRequest,
} from '~/types/transactions';

const BASE = '/transactions';

/**
 * Request config for an idempotency-aware write — omitted entirely when no key is given, so the
 * call is byte-identical to before for every caller that doesn't pass one. A keyed write is always
 * a queued one (see app/lib/offline-mutations.ts): it is retried and reported by the queue itself,
 * so the axios interceptors stay quiet (`silent`) instead of toasting on every attempt.
 */
function idempotencyHeaders(idempotencyKey?: string) {
  return idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey }, silent: true } : undefined;
}

export const transactionsApi = {
  getAll: listRequest<TransactionsResponse>(BASE),
  getById: detailRequest<TransactionResponse>(BASE),
  // The enriched payload is called `detail` here, not `full` — the only endpoint that deviates.
  getDetail: nestedDetailRequest<TransactionDetailResponse>(BASE, 'detail'),
  delete: deleteRequest(BASE),
  ...jsonWrites<CreateTransactionRequest, UpdateTransactionRequest>(BASE),

  // create/pay/refund override the jsonWrites `create` and get a second, optional
  // `idempotencyKey` param — the only three endpoints the backend's
  // IdempotencyInterceptor is wired to (see trade-crm-backend). The key is generated
  // once when a mutation is queued offline (app/lib/offline-mutations.ts) and reused
  // on every retry/resume of that same operation, so a replay never double-charges.
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
