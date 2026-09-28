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

export const transactionsApi = {
  getAll: listRequest<TransactionsResponse>(BASE),
  getById: detailRequest<TransactionResponse>(BASE),
  // The enriched payload is called `detail` here, not `full` — the only endpoint that deviates.
  getDetail: nestedDetailRequest<TransactionDetailResponse>(BASE, 'detail'),
  delete: deleteRequest(BASE),
  ...jsonWrites<CreateTransactionRequest, UpdateTransactionRequest>(BASE),

  pay: async ({ request, id }: { request: CreatePaymentRequest; id: string }) => {
    const { data } = await apiClient.patch(`${BASE}/${id}/pay`, request);
    return data;
  },

  refund: async ({
    id,
    request,
  }: {
    id: string;
    request?: RefundTransactionRequest;
  }): Promise<TransactionDetailResponse> => {
    const { data } = await apiClient.post(`${BASE}/${id}/refund`, request ?? {});
    return data;
  },
};
