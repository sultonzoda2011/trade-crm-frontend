import { deleteRequest, detailRequest, listRequest, multipartWrites, nestedDetailRequest } from '~/api/crud';
import { apiClient } from '~/lib/client';
import type {
  CreateSellerCreditRequest,
  SellerBalanceResponse,
  SellerCreditResponse,
  SellerCreditsResponse,
  SellerDetailResponse,
  SellerFullResponse,
  SellersResponse,
} from '~/types/sellers';

const BASE = '/sellers';

export const sellersApi = {
  getAll: listRequest<SellersResponse>(BASE),
  getById: detailRequest<SellerDetailResponse>(BASE),
  getFull: nestedDetailRequest<SellerFullResponse>(BASE),
  delete: deleteRequest(BASE),
  ...multipartWrites(BASE),

  // Seller money lives on its own sub-resources — not part of the CRUD shape.
  getBalance: async (id: string): Promise<SellerBalanceResponse> => {
    const { data } = await apiClient.get(`${BASE}/${id}/balance`);
    return data;
  },
  getCredits: async (id: string, page = 1, limit = 10): Promise<SellerCreditsResponse> => {
    const { data } = await apiClient.get(`${BASE}/${id}/credits`, { params: { page, limit } });
    return data;
  },
  createCredit: async ({
    id,
    request,
  }: {
    id: string;
    request: CreateSellerCreditRequest;
  }): Promise<SellerCreditResponse> => {
    const { data } = await apiClient.post(`${BASE}/${id}/credits`, request);
    return data;
  },
};
