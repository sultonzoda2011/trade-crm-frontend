import { deleteRequest, detailRequest, listRequest, multipartWrites, nestedDetailRequest } from '~/api/crud';
import type { MarketDetailResponse, MarketFullResponse, MarketsResponse } from '~/types/markets';

const BASE = '/markets';

export const marketsApi = {
  getAll: listRequest<MarketsResponse>(BASE),
  getById: detailRequest<MarketDetailResponse>(BASE),
  getFull: nestedDetailRequest<MarketFullResponse>(BASE),
  delete: deleteRequest(BASE),
  ...multipartWrites(BASE),
};
