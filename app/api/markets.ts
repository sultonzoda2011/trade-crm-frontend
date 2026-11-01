import { apiClient } from '~/lib/client';
import { deleteRequest, detailRequest, listRequest, multipartWrites, nestedDetailRequest } from '~/api/crud';
import type {
  MarketDetailResponse,
  MarketOverviewResponse,
  MarketsResponse,
  UpdateMarketSettingsRequest,
} from '~/types/markets';

const BASE = '/markets';

export const marketsApi = {
  getAll: listRequest<MarketsResponse>(BASE),
  getById: detailRequest<MarketDetailResponse>(BASE),
  /** Главный экран рынка: карточка + сводка. Деньги сервер отдаёт только админу и владельцу. */
  getOverview: nestedDetailRequest<MarketOverviewResponse>(BASE, 'overview'),
  delete: deleteRequest(BASE),
  ...multipartWrites(BASE),
  /** Настройки рынка (владелец своего рынка или админ). Не multipart: это переключатель, не карточка. */
  updateSettings: async ({ id, request }: { id: string; request: UpdateMarketSettingsRequest }) =>
    (await apiClient.patch<MarketDetailResponse>(`${BASE}/${id}/settings`, request)).data,
};
