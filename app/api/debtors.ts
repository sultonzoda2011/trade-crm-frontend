import { apiClient } from '~/lib/client';
import { filtersToParams } from '~/lib/filtersToParams';
import { getUserInfo } from '~/lib/auth-utils';
import { getRecord, listRecords, upsertRecord } from '~/lib/offline/db';
import { newLocalId } from '~/lib/offline/localIds';
import { getIsOnline } from '~/lib/offline/networkStatus';
import { enqueueOutbox } from '~/lib/offline/outbox';
import type { OfflineDebtor } from '~/lib/offline/types';
import type { Debtor, DebtorDetailResponse, DebtorRequest, DebtorsResponse } from '~/types/debtors';
import type { ActiveFilter } from '~/types/filters';

const isOffline = (): boolean => !getIsOnline();

/**
 * Локально мы храним только то, что реально нужно офлайн (id/name/phone) —
 * долговая аналитика (risk/score/repaymentRate…) считается сервером и
 * появится, как только эта запись доедет туда через outbox и вернётся
 * обратно через /sync/pull. До этого момента поля-заглушки безопасны:
 * этот объект нужен только чтобы выбрать должника в форме создания
 * транзакции (id + name), а не для страницы аналитики должника.
 */
function toDebtorStub(d: OfflineDebtor): Debtor {
  return {
    id: d.id,
    name: d.name,
    phone: d.phone,
    marketId: d.marketId,
    createdAt: d.updatedAt,
    updatedAt: d.updatedAt,
    market: null,
    _count: { transactions: 0 },
    totalDebtAmount: 0,
    activeDebtCount: 0,
    overdueAmount: 0,
    overdueCount: 0,
    totalIssued: 0,
    totalCollected: 0,
    repaymentRate: 0,
    maxDaysOverdue: 0,
    daysSinceLastPayment: null,
    lastPaymentAt: null,
    nextDueDate: null,
    risk: 'LOW',
    score: 0,
    factors: [],
  } as unknown as Debtor;
}

export const debtorsApi = {
  getAll: async (
    page = 1,
    limit = 20,
    options: { search?: string; dateFrom?: string; dateTo?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {},
    filters: ActiveFilter[] = []
  ): Promise<DebtorsResponse> => {
    if (isOffline()) {
      // Оффлайн — сервер недоступен, значит и аналитика недоступна.
      // Отдаём то, что есть в локальном кэше (последний /sync/pull) плюс
      // должников, созданных здесь же офлайн и ещё не уехавших на сервер —
      // иначе их не найти в форме создания транзакции сразу после создания.
      const all = await listRecords<OfflineDebtor>('debtors');
      const search = options.search?.trim().toLowerCase();
      const filtered = search
        ? all.filter((d) => d.name.toLowerCase().includes(search) || d.phone.includes(search))
        : all;
      const start = (page - 1) * limit;
      const pageItems = filtered.slice(start, start + limit).map(toDebtorStub);
      return {
        success: true,
        data: {
          data: pageItems,
          meta: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) || 1 },
        },
        timestamp: new Date().toISOString(),
      };
    }
    const { data } = await apiClient.get('/debtors', {
      params: {
        page,
        limit,
        ...options,
        ...filtersToParams(filters),
      },
    });
    return data;
  },

  getById: async (id: string): Promise<DebtorDetailResponse> => {
    const { data } = await apiClient.get(`/debtors/${id}`);
    return data;
  },
  create: async (request: DebtorRequest) => {
    if (isOffline()) {
      const user = getUserInfo();
      const now = new Date().toISOString();
      const local: OfflineDebtor = { id: newLocalId(), name: request.name, phone: request.phone, marketId: user?.marketId ?? '', updatedAt: now };
      await upsertRecord('debtors', local);
      await enqueueOutbox({ method: 'post', url: '/debtors', body: request, entity: 'debtors', localId: local.id });
      return { success: true, data: toDebtorStub(local), timestamp: now };
    }
    const { data } = await apiClient.post(`/debtors`, request);
    return data;
  },
  update: async ({ request, id }: { request: DebtorRequest; id: string }) => {
    if (isOffline()) {
      const existing = await getRecord<OfflineDebtor>('debtors', id);
      const now = new Date().toISOString();
      const local: OfflineDebtor = {
        id,
        name: request.name,
        phone: request.phone,
        marketId: existing?.marketId ?? getUserInfo()?.marketId ?? '',
        updatedAt: now,
      };
      await upsertRecord('debtors', local);
      await enqueueOutbox({ method: 'patch', url: `/debtors/${id}`, body: request, entity: 'debtors', localId: id });
      return { success: true, data: toDebtorStub(local), timestamp: now };
    }
    const { data } = await apiClient.patch(`/debtors/${id}`, request);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/debtors/${id}`);
  },
};
