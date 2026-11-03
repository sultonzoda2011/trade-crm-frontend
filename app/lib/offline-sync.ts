import type { QueryClient, QueryKey } from '@tanstack/react-query';
import axios, { type AxiosRequestConfig } from 'axios';
import { categoriesApi } from '~/api/categories';
import type { ListOptions } from '~/api/crud';
import { dashboardApi } from '~/api/dashboard';
import { debtorsApi } from '~/api/debtors';
import { marketsApi } from '~/api/markets';
import { productsApi } from '~/api/products';
import { profileApi } from '~/api/profile';
import { sellersApi } from '~/api/sellers';
import { transactionsApi } from '~/api/transactions';
import { usersApi } from '~/api/users';
import { Action, ACTION_PERMISSIONS } from '~/config/actions';
import { STOCK_ANALYSIS_DAYS } from '~/config/dashboard';
import { canAccess } from '~/config/permissions';
import { getClientUser } from '~/lib/auth-utils';
import { getErrorStatus, getRetryAfterSeconds, isTransientError } from '~/lib/offline-errors';
import { getIsOnline, subscribeToNetworkStatus } from '~/lib/network-status';
import { offlineStorage } from '~/lib/offline-storage';
import { queryKeys, type Entity } from '~/lib/query-keys';
import { flushPersistedCache } from '~/lib/query-persister';
import { DEFAULT_PAGE_LIMIT } from '~/store/useTableStore';
import { Role, type ApiResponse, type PaginatedData } from '~/types/common';
import type { ActiveFilter } from '~/types/filters';

/**
 * «Синхронизировать всё»: одним запуском кладёт в кеш всё, что нужно, чтобы
 * приложение без интернета не показывало пустые экраны.
 *
 * Что именно загружается (только то, что разрешено роли):
 *   • профиль и дашборд за текущий период;
 *   • справочники для форм и фильтров (товары/должники/категории… для «Новой
 *     транзакции» и выпадающих списков);
 *   • СПИСКИ каждой сущности — все страницы, которые видит пользователь;
 *   • КАРТОЧКИ каждой записи — те самые экраны «по id».
 *
 * Как не упереться в лимит бэкенда (100 запросов/мин на IP, общий для всех, кто
 * сидит на одном Wi-Fi): списки качаются крупными пачками по 100 строк, а из
 * каждой пачки нарезаются 10 страниц по 10 — ровно те ключи кеша, которыми
 * пользуются таблицы. Один запрос вместо десяти. Карточки идут размеренно
 * (≈1 запрос в секунду), на 429 синхронизация сама ждёт и продолжает. Свежее
 * (загруженное недавно) пропускается, поэтому прерванный запуск можно спокойно
 * повторить — он продолжит с того же места.
 */

// ---------------------------------------------------------------------------
// Что синхронизируем
// ---------------------------------------------------------------------------

type ListFn = (
  page: number,
  limit: number,
  options: ListOptions,
  filters: ActiveFilter[],
  config?: AxiosRequestConfig
) => Promise<ApiResponse<PaginatedData<{ id: string }>>>;

type DetailFn = (id: string, config?: AxiosRequestConfig) => Promise<unknown>;

export interface EntitySpec {
  entity: Entity;
  /** Право на API списка (то же, что проверяет перехватчик в client.ts). */
  listAction: Action;
  list: ListFn;
  /** Какой ключ занимает карточка: у товаров экран просмотра читает `detail`, у остальных — `full`. */
  detailKind: 'full' | 'detail';
  detail: DetailFn;
  /** Сколько самых новых карточек берём: на тысячах записей полная выгрузка заняла бы часы. */
  detailCap: number;
  /** Порядок списка по умолчанию (как у таблицы на экране); нет — «новые сверху». */
  defaultSort?: { sortBy: string; sortOrder: 'asc' | 'desc' };
}

/** Порядок = порядок показа на странице и приоритет загрузки: сначала то, без чего не продать. */
export const ENTITY_SPECS: EntitySpec[] = [
  {
    entity: 'transactions',
    listAction: Action.TRANSACTIONS_VIEW,
    list: transactionsApi.getAll as unknown as ListFn,
    detailKind: 'full',
    detail: transactionsApi.getDetail as DetailFn,
    detailCap: 500,
  },
  {
    entity: 'debtors',
    listAction: Action.DEBTORS_VIEW,
    list: debtorsApi.getAll as unknown as ListFn,
    detailKind: 'full',
    detail: debtorsApi.getFull as DetailFn,
    detailCap: 500,
  },
  {
    entity: 'products',
    listAction: Action.PRODUCTS_VIEW,
    list: productsApi.getAll as unknown as ListFn,
    detailKind: 'detail',
    detail: productsApi.getById as DetailFn,
    detailCap: 500,
  },
  {
    entity: 'categories',
    listAction: Action.CATEGORIES_VIEW,
    list: categoriesApi.getAll as unknown as ListFn,
    detailKind: 'full',
    detail: categoriesApi.getFull as DetailFn,
    detailCap: 300,
    // Владелец сам задаёт порядок категорий — копия для офлайна должна быть в том же порядке.
    defaultSort: { sortBy: 'sortOrder', sortOrder: 'asc' },
  },
  {
    entity: 'sellers',
    listAction: Action.SELLERS_VIEW,
    list: sellersApi.getAll as unknown as ListFn,
    detailKind: 'full',
    detail: sellersApi.getFull as DetailFn,
    detailCap: 300,
  },
  {
    entity: 'markets',
    listAction: Action.MARKETS_VIEW,
    list: marketsApi.getAll as unknown as ListFn,
    detailKind: 'full',
    detail: marketsApi.getOverview as DetailFn,
    detailCap: 300,
  },
  {
    entity: 'users',
    listAction: Action.USERS_VIEW,
    list: usersApi.getAll as unknown as ListFn,
    detailKind: 'full',
    detail: usersApi.getFull as DetailFn,
    detailCap: 300,
  },
];

const roleCan = (role: Role, action: Action) => ACTION_PERMISSIONS[action]?.includes(role) ?? false;

/** Сущность попадает в синхронизацию, если роль может и вызвать API списка, и открыть страницу списка. */
export function canSyncEntity(spec: EntitySpec, role: Role): boolean {
  if (spec.entity === 'markets') {
    const user = getClientUser();
    const canSyncOwnMarket =
      Boolean(user?.marketId) && roleCan(role, Action.MARKETS_VIEW_BY_ID) && canAccess(role, '/markets/0');
    if (canSyncOwnMarket) return true;
  }
  return roleCan(role, spec.listAction) && canAccess(role, `/${spec.entity}`);
}

/** Карточки качаем, только если роль может открыть страницу записи. */
const canSyncDetails = (spec: EntitySpec, role: Role) => canAccess(role, `/${spec.entity}/0`);

/** Сколько строк списка забираем за раз — максимум, который разрешает бэкенд. */
const CHUNK_SIZE = 100;
/** Верхняя граница строк списка на сущность: дальше — только онлайн. */
const MAX_LIST_ROWS = 1000;
/**
 * Загруженное позже этого времени считаем свежим и не качаем повторно (резюме
 * прерванного запуска), а также используем как окно «данные ещё актуальны» для
 * кнопки «Синхронизировать всё»/«Обновить» на /sync.
 */
export const FRESH_WINDOW_MS = 15 * 60 * 1000;

/**
 * Что синхронизировать: всё (`'all'`, шапка + справочники + все сущности) или
 * только одна сущность — тогда качаются только её списки и карточки, без
 * профиля/дашборда/справочников для других страниц.
 */
export type SyncScope = 'all' | Entity;

// ---------------------------------------------------------------------------
// Состояние запуска
// ---------------------------------------------------------------------------

export type SyncGroupId = Entity | 'profile' | 'dashboard' | 'reference';

export interface GroupProgress {
  done: number;
  total: number;
  failed: number;
}

export interface SyncSnapshot {
  /** preparing — ещё выясняем, сколько всего записей; running — объём известен. */
  phase: 'preparing' | 'running';
  done: number;
  total: number;
  failed: number;
  groups: Partial<Record<SyncGroupId, GroupProgress>>;
  /** Сети нет: запуск стоит и сам продолжится, когда она появится. */
  waitingNetwork: boolean;
  /** Сервер попросил притормозить (429): до какого момента ждём. */
  throttledUntil: number | null;
}

export type SyncOutcome = 'complete' | 'partial' | 'cancelled' | 'throttled' | 'unauthorized';

export interface LastSync {
  finishedAt: number;
  outcome: SyncOutcome;
  done: number;
  total: number;
  failed: number;
}

/** Отметки последнего запуска по каждому scope: `'all'` — «Синхронизировать всё», остальное — одна сущность. */
type SyncHistory = Partial<Record<SyncScope, LastSync>>;

class AbortedError extends Error {}
class ThrottledError extends Error {}
class UnauthorizedError extends Error {}

// ---------------------------------------------------------------------------
// Последний запуск (для «Обновлено …» после перезапуска приложения)
// ---------------------------------------------------------------------------

const LAST_SYNC_KEY = 's:last';

async function readSyncHistory(): Promise<SyncHistory> {
  const raw = await offlineStorage.getItem(LAST_SYNC_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as SyncHistory | LastSync;
    // Старый формат — один плоский LastSync для полной синхронизации (до scope).
    if ('finishedAt' in parsed) return { all: parsed as LastSync };
    return parsed as SyncHistory;
  } catch {
    return {};
  }
}

export async function readLastSync(scope: SyncScope = 'all'): Promise<LastSync | null> {
  const history = await readSyncHistory();
  return history[scope] ?? null;
}

async function writeLastSync(scope: SyncScope, value: LastSync) {
  const history = await readSyncHistory();
  history[scope] = value;
  await offlineStorage.setItem(LAST_SYNC_KEY, JSON.stringify(history));
}

export async function clearLastSync() {
  await offlineStorage.removeItem(LAST_SYNC_KEY);
}

// ---------------------------------------------------------------------------
// Покрытие кеша — что реально лежит в кеше прямо сейчас (для страницы)
// ---------------------------------------------------------------------------

export interface EntityCoverage {
  entity: Entity;
  /** Сколько записей на сервере по данным последней загрузки списка; null — список ещё не грузили. */
  total: number | null;
  /** Сколько карточек лежит в кеше. */
  details: number;
  /** Сколько карточек мы стремимся иметь (с учётом лимита). */
  target: number | null;
  /** Когда обновлялся список. */
  updatedAt: number | null;
  /** Все ли страницы списка и карточки актуальны и не инвалидированы. */
  upToDate: boolean;
}

/**
 * Достаёт основную запись из ответа карточки (`detail` или `full`).
 * Для `markets` карточка хранит `{ market, summary }` (ответ `/markets/:id/overview`) —
 * старый кеш от `/markets/:id/full` без `summary` считаем неполным.
 */
function unwrapDetailRecord(entity: Entity, data: unknown): Record<string, unknown> | null {
  const payload = (data as ApiResponse<Record<string, unknown>> | undefined)?.data;
  if (!payload || typeof payload !== 'object') return null;
  if (entity === 'debtors') return (payload.debtor as Record<string, unknown>) ?? null;
  if (entity === 'categories') return (payload.category as Record<string, unknown>) ?? null;
  if (entity === 'sellers') return (payload.seller as Record<string, unknown>) ?? null;
  if (entity === 'markets') {
    if (!payload.summary) return null;
    return (payload.market as Record<string, unknown>) ?? null;
  }
  if (entity === 'users') return (payload.user as Record<string, unknown>) ?? null;
  return payload;
}

/**
 * Проверяет, совпадает ли закешированная карточка с актуальной строкой списка:
 * если запись изменилась на сервере (по `updatedAt` или ключевым полям/счётчикам),
 * возвращаем `false`, чтобы догрузить ТОЛЬКО изменившуюся карточку, а не все 500.
 */
function detailFieldsMatch(
  entity: Entity,
  record: Record<string, unknown>,
  listRow: Record<string, unknown>
): boolean {
  if (record.updatedAt && listRow.updatedAt && record.updatedAt !== listRow.updatedAt) {
    return false;
  }
  const recCount = (record._count as Record<string, unknown> | undefined)?.products;
  const rowCount = (listRow._count as Record<string, unknown> | undefined)?.products;

  switch (entity) {
    case 'transactions':
      return (
        record.status === listRow.status &&
        record.paidAmount === listRow.paidAmount &&
        record.totalAmount === listRow.totalAmount
      );
    case 'debtors':
      return (
        record.totalDebt === listRow.totalDebt &&
        record.paidAmount === listRow.paidAmount &&
        record.remainingAmount === listRow.remainingAmount &&
        record.name === listRow.name &&
        record.phone === listRow.phone
      );
    case 'products':
      return (
        record.quantity === listRow.quantity &&
        record.price === listRow.price &&
        record.costPrice === listRow.costPrice &&
        record.isActive === listRow.isActive &&
        recCount === rowCount
      );
    case 'categories':
      return record.name === listRow.name && recCount === rowCount;
    case 'sellers':
      return record.commissionPct === listRow.commissionPct;
    case 'markets':
      return (
        record.name === listRow.name &&
        record.address === listRow.address &&
        record.phone === listRow.phone &&
        record.workHours === listRow.workHours &&
        record.allowSellerSales === listRow.allowSellerSales
      );
    case 'users':
      return (
        record.firstName === listRow.firstName &&
        record.lastName === listRow.lastName &&
        record.phone === listRow.phone &&
        record.role === listRow.role &&
        record.marketId === listRow.marketId
      );
  }
}

export function isDetailUpToDate(
  queryClient: QueryClient,
  spec: EntitySpec,
  id: string,
  listRow?: Record<string, unknown>
): boolean {
  const key = queryKeys[spec.detailKind](spec.entity, id);
  const state = queryClient.getQueryState(key);
  if (!state || state.data === undefined || state.isInvalidated) return false;
  const record = unwrapDetailRecord(spec.entity, state.data);
  if (!record) return false;
  if (!listRow) return true;
  return detailFieldsMatch(spec.entity, record, listRow);
}

/** Собирает строки из последовательных закешированных страниц списка (page 1..N). */
function getCachedListRows(
  queryClient: QueryClient,
  entity: Entity
): {
  rows: Array<Record<string, unknown> & { id: string }>;
  total: number | null;
  updatedAt: number | null;
  allPagesValid: boolean;
} {
  const firstPage = queryClient.getQueryState<ApiResponse<PaginatedData<Record<string, unknown> & { id: string }>>>(
    queryKeys.list(entity, { page: 1, limit: DEFAULT_PAGE_LIMIT, search: '', filters: [] })
  );
  const total = firstPage?.data?.data?.meta?.total ?? null;
  const updatedAt = firstPage?.dataUpdatedAt ?? null;
  if (total === null) {
    return { rows: [], total: null, updatedAt: null, allPagesValid: false };
  }

  const cappedTotal = Math.min(total, MAX_LIST_ROWS);
  const expectedPages = Math.max(1, Math.ceil(cappedTotal / DEFAULT_PAGE_LIMIT));
  const rows: Array<Record<string, unknown> & { id: string }> = [];
  let allPagesValid = !firstPage?.isInvalidated;

  for (let page = 1; page <= expectedPages; page++) {
    const pageState = queryClient.getQueryState<ApiResponse<PaginatedData<Record<string, unknown> & { id: string }>>>(
      queryKeys.list(entity, { page, limit: DEFAULT_PAGE_LIMIT, search: '', filters: [] })
    );
    const pageRows = pageState?.data?.data?.data;
    if (!pageState || !pageRows) {
      allPagesValid = false;
      break;
    }
    if (pageState.isInvalidated) allPagesValid = false;
    rows.push(...pageRows);
  }

  if (rows.length < cappedTotal) allPagesValid = false;
  return { rows, total, updatedAt, allPagesValid };
}

export function getEntityCoverage(queryClient: QueryClient, spec: EntitySpec): EntityCoverage {
  const user = getClientUser();
  const role = user?.role;

  // Особый случай: для владельца/продавца список рынков недоступен, синхронизируется только свой рынок (`marketId`).
  if (
    spec.entity === 'markets' &&
    role &&
    !roleCan(role, spec.listAction) &&
    user?.marketId &&
    roleCan(role, Action.MARKETS_VIEW_BY_ID)
  ) {
    const marketKey = queryKeys.full('markets', user.marketId);
    const marketState = queryClient.getQueryState(marketKey);
    const loaded = Boolean((marketState?.data as ApiResponse<{ summary?: unknown }> | undefined)?.data?.summary);
    const upToDate = Boolean(loaded && marketState && !marketState.isInvalidated);
    return {
      entity: 'markets',
      total: loaded ? 1 : null,
      details: loaded ? 1 : 0,
      target: 1,
      updatedAt: marketState?.dataUpdatedAt ?? null,
      upToDate,
    };
  }

  const { rows, total, updatedAt, allPagesValid } = getCachedListRows(queryClient, spec.entity);
  const target = total === null ? null : Math.min(total, spec.detailCap);
  const needsDetails = role ? canSyncDetails(spec, role) : true;

  let validDetails = 0;
  if (target !== null && rows.length > 0) {
    const slice = rows.slice(0, target);
    for (const row of slice) {
      if (isDetailUpToDate(queryClient, spec, row.id, row)) {
        validDetails += 1;
      }
    }
  } else {
    validDetails = queryClient
      .getQueryCache()
      .findAll({ queryKey: [spec.entity, spec.detailKind] })
      .filter((query) => query.state.data !== undefined && !query.state.isInvalidated).length;
  }

  const detailsComplete = !needsDetails || (target !== null && validDetails >= target);
  const upToDate = total !== null && allPagesValid && detailsComplete;

  return {
    entity: spec.entity,
    total,
    details: target !== null ? Math.min(validDetails, target) : validDetails,
    target,
    updatedAt,
    upToDate,
  };
}

/**
 * Актуальна ли сущность прямо сейчас: все страницы списка и карточки лежат в
 * кеше и ни одна запись не помечена как устаревшая (`isInvalidated`).
 * Используется, чтобы отключать кнопку «Обновить»/«Синхронизировать всё», когда
 * последняя версия уже загружена.
 */
export function isEntityUpToDate(queryClient: QueryClient, spec: EntitySpec, role: Role): boolean {
  if (!canSyncEntity(spec, role)) return true; // роль её не синхронизирует — не блокируем кнопку этим
  return getEntityCoverage(queryClient, spec).upToDate;
}

/** Актуальны ли сразу все сущности, доступные роли (для главной кнопки «Синхронизировать всё»). */
export function isAllUpToDate(queryClient: QueryClient, role: Role): boolean {
  const entities = ENTITY_SPECS.filter((spec) => canSyncEntity(spec, role));
  if (entities.length === 0) return true;
  return entities.every((spec) => isEntityUpToDate(queryClient, spec, role));
}

// ---------------------------------------------------------------------------
// Движок
// ---------------------------------------------------------------------------

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new AbortedError());
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new AbortedError());
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });

/** Минимальный интервал между стартами запросов — держит нас заметно ниже лимита 100/мин. */
const BASE_GAP_MS = 900;
const MAX_GAP_MS = 3000;
/** Бэкенд блокирует на окно throttler'а (60 с) — ждём чуть дольше, если сервер не сказал точнее. */
const DEFAULT_THROTTLE_WAIT_S = 62;
const MAX_CONSECUTIVE_429 = 3;
const MAX_TRANSIENT_RETRIES = 2;
const CONCURRENCY = 2;

interface Task {
  group: SyncGroupId;
  run: () => Promise<'done' | 'skipped'>;
}

export interface RunSyncOptions {
  queryClient: QueryClient;
  signal: AbortSignal;
  onProgress: (snapshot: SyncSnapshot) => void;
  /** `'all'` (по умолчанию) — полная синхронизация; конкретная сущность — только её списки и карточки. */
  scope?: SyncScope;
}

export async function runSync({
  queryClient,
  signal,
  onProgress,
  scope = 'all',
}: RunSyncOptions): Promise<SyncOutcome> {
  const user = getClientUser();
  if (!user) return 'unauthorized';
  const { role, marketId } = user;
  const can = (action: Action) => roleCan(role, action);
  const full = scope === 'all';

  const snapshot: SyncSnapshot = {
    phase: 'preparing',
    done: 0,
    total: 0,
    failed: 0,
    groups: {},
    waitingNetwork: false,
    throttledUntil: null,
  };

  // ---- прогресс: отдаём не чаще пяти раз в секунду ----
  let lastEmit = 0;
  let trailing: ReturnType<typeof setTimeout> | null = null;
  const emit = (force = false) => {
    const now = Date.now();
    if (force || now - lastEmit >= 200) {
      if (trailing) clearTimeout(trailing);
      trailing = null;
      lastEmit = now;
      onProgress({ ...snapshot, groups: { ...snapshot.groups } });
    } else if (!trailing) {
      trailing = setTimeout(() => emit(true), 200);
    }
  };

  const group = (id: SyncGroupId): GroupProgress => (snapshot.groups[id] ??= { done: 0, total: 0, failed: 0 });
  const plan = (id: SyncGroupId, count: number) => {
    group(id).total += count;
    snapshot.total += count;
  };
  const complete = (id: SyncGroupId) => {
    group(id).done += 1;
    snapshot.done += 1;
  };
  const fail = (id: SyncGroupId) => {
    group(id).failed += 1;
    snapshot.failed += 1;
    complete(id);
  };

  // ---- сеть, лимиты, повторы ----
  let nextSlotAt = 0;
  let gap = BASE_GAP_MS;
  let consecutive429 = 0;

  const waitForNetwork = async () => {
    if (getIsOnline()) return;
    snapshot.waitingNetwork = true;
    emit(true);
    await new Promise<void>((resolve) => {
      const done = () => {
        unsubscribe();
        signal.removeEventListener('abort', done);
        resolve();
      };
      const unsubscribe = subscribeToNetworkStatus((online) => online && done());
      signal.addEventListener('abort', done, { once: true });
    });
    snapshot.waitingNetwork = false;
    emit(true);
    if (signal.aborted) throw new AbortedError();
  };

  const takeSlot = async () => {
    const now = Date.now();
    const start = Math.max(now, nextSlotAt);
    nextSlotAt = start + gap;
    if (start > now) await sleep(start - now, signal);
  };

  /** Один запрос с учётом сети, темпа, 429 и временных сбоев. */
  const call = async <T>(request: (config: AxiosRequestConfig) => Promise<T>): Promise<T> => {
    let retries = 0;
    for (;;) {
      if (signal.aborted) throw new AbortedError();
      await waitForNetwork();
      await takeSlot();
      try {
        const result = await request({ silent: true, signal });
        consecutive429 = 0;
        return result;
      } catch (error) {
        if (signal.aborted || axios.isCancel(error)) throw new AbortedError();

        const status = getErrorStatus(error);
        if (status === 401) throw new UnauthorizedError();

        if (status === 429) {
          consecutive429 += 1;
          if (consecutive429 > MAX_CONSECUTIVE_429) throw new ThrottledError();
          const waitMs = (getRetryAfterSeconds(error) ?? DEFAULT_THROTTLE_WAIT_S) * 1000;
          gap = Math.min(Math.round(gap * 1.5), MAX_GAP_MS);
          nextSlotAt = Math.max(nextSlotAt, Date.now() + waitMs);
          snapshot.throttledUntil = Date.now() + waitMs;
          emit(true);
          await sleep(waitMs, signal);
          snapshot.throttledUntil = null;
          emit(true);
          continue;
        }

        if (isTransientError(error) && retries < MAX_TRANSIENT_RETRIES) {
          retries += 1;
          await sleep(2000 * retries, signal);
          continue;
        }
        throw error;
      }
    }
  };

  const store = (key: QueryKey, data: unknown) => queryClient.setQueryData(key, data);

  /** Проверка, что ключ уже есть в кеше и не помечен как устаревший (`isInvalidated`). */
  const isKeyValid = (key: QueryKey) => {
    const state = queryClient.getQueryState(key);
    return Boolean(state && state.data !== undefined && !state.isInvalidated);
  };

  // Все сущности, доступные роли (или одна сущность при точечном запуске).
  const candidateEntities = ENTITY_SPECS.filter(
    (spec) => (full || spec.entity === scope) && canSyncEntity(spec, role)
  );
  // Качаем ТОЛЬКО те сущности, в которых что-то устарело или отсутствует —
  // благодаря этому изменение одного товара или должника не перезапускает синхронизацию всех остальных разделов.
  const staleEntities = candidateEntities.filter((spec) => !isEntityUpToDate(queryClient, spec, role));
  const onlyDelta = staleEntities.length > 0 && staleEntities.length < candidateEntities.length;
  const entitiesToSync = staleEntities.length > 0 ? staleEntities : candidateEntities;

  // ---- общий пул воркеров ----
  // `as`: иначе TS сузит тип до `null` — он не видит присваиваний из замыканий воркеров.
  let fatal = null as Error | null;

  const execute = async (task: Task) => {
    try {
      await task.run();
      complete(task.group);
    } catch (error) {
      if (error instanceof AbortedError || error instanceof ThrottledError || error instanceof UnauthorizedError) {
        fatal ??= error;
        return;
      }
      // 404 на карточке — запись удалили между загрузкой списка и карточки; это не сбой синхронизации.
      if (getErrorStatus(error) === 404) complete(task.group);
      else fail(task.group);
    }
    emit();
  };

  const runPool = async (tasks: Task[]) => {
    let index = 0;
    const worker = async () => {
      while (!fatal && index < tasks.length) {
        const task = tasks[index++];
        await execute(task);
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  };

  // ---- задачи ----
  const tasks1: Task[] = [];
  const addMeta = (
    id: 'profile' | 'dashboard' | 'reference',
    keysToCheck: QueryKey[],
    run: () => Promise<unknown>
  ) => {
    // Если мы догружаем дельту и все целевые ключи уже валидны в кеше — пропускаем лишний сетевой запрос.
    if (onlyDelta && keysToCheck.length > 0 && keysToCheck.every(isKeyValid)) {
      return;
    }
    plan(id, 1);
    tasks1.push({
      group: id,
      run: async () => {
        await run();
        return 'done';
      },
    });
  };

  // Для синхронизации одной сущности профиль/дашборд/справочники не трогаем —
  // они не связаны с конкретной страницей списка и грузятся только «Всё».
  if (full) {
    // Профиль: шапка читает compact `me`, страница профиля — `full` (профиль, рынок, заработок продавца).
    addMeta('profile', [queryKeys.me()], async () =>
      store(queryKeys.me(), await call((c) => profileApi.getProfile(c)))
    );
    addMeta('profile', [queryKeys.profile()], async () =>
      store(queryKeys.profile(), await call((c) => profileApi.getFullProfile(c)))
    );

    // Дашборд — для периода по умолчанию (то, что видно при первом заходе).
    if (can(Action.DASHBOARDS_VIEW)) {
      const params = { period: 'month' };
      addMeta('dashboard', [queryKeys.dashboard('overview', params)], async () =>
        store(queryKeys.dashboard('overview', params), await call((c) => dashboardApi.getOverview(params, c)))
      );
      addMeta('dashboard', [queryKeys.dashboard('recent-transactions', { sellerId: undefined })], async () =>
        store(
          queryKeys.dashboard('recent-transactions', { sellerId: undefined }),
          await call((c) => transactionsApi.getAll(1, 5, { sortBy: 'createdAt', sortOrder: 'desc' }, [], c))
        )
      );
      addMeta('dashboard', [queryKeys.dashboard('sellers-report', params)], async () =>
        store(
          queryKeys.dashboard('sellers-report', params),
          await call((c) => dashboardApi.getSellersReport(params, c))
        )
      );
      addMeta('dashboard', [queryKeys.dashboard('stock', { days: STOCK_ANALYSIS_DAYS })], async () =>
        store(
          queryKeys.dashboard('stock', { days: STOCK_ANALYSIS_DAYS }),
          await call((c) => dashboardApi.getStockOverview(c))
        )
      );
    }

    // Сводки для шапок таблиц транзакций, должников и товаров (чтобы работали офлайн).
    if (can(Action.TRANSACTIONS_VIEW)) {
      const txSummaryKey = queryKeys.sub('transactions', 'summary', null, {
        filters: [],
        search: undefined,
      });
      addMeta('reference', [txSummaryKey], async () =>
        store(txSummaryKey, await call((c) => transactionsApi.getSummary({ search: undefined }, [], c)))
      );
    }
    if (can(Action.DEBTORS_VIEW)) {
      const debtorsSummaryKey = queryKeys.sub('debtors', 'summary');
      addMeta('reference', [debtorsSummaryKey], async () =>
        store(debtorsSummaryKey, await call((c) => debtorsApi.getSummary(c)))
      );
    }
    if (can(Action.PRODUCTS_STOCK)) {
      const productsSummaryKey = queryKeys.sub('products', 'summary');
      addMeta('reference', [productsSummaryKey], async () =>
        store(productsSummaryKey, await call((c) => productsApi.getSummary(c)))
      );
    }

    // Справочники. Ключи и форма данных — ровно те, что читают экраны (см. комментарий у каждого):
    // выпадающие списки через useAsyncSelectOptions хранят МАССИВ строк под ключом с хвостом '' (пустой поиск),
    // фильтры и превью читают ПОЛНЫЙ ответ API.
    if (can(Action.DEBTORS_VIEW)) {
      const k1 = queryKeys.options('debtors', { scope: 'filters', limit: 100 });
      const k2 = [...queryKeys.options('debtors', { scope: 'form', limit: 100 }), ''];
      addMeta('reference', [k1, k2], async () => {
        const response = await call((c) => debtorsApi.getAll(1, 100, {}, [], c));
        store(k1, response); // транзакции: фильтр
        store(k2, response?.data?.data ?? []); // новая транзакция
      });
    }
    if (can(Action.PRODUCTS_VIEW)) {
      const k1 = queryKeys.options('products', { scope: 'filters', limit: 100 });
      const k2 = [...queryKeys.options('products', { scope: 'form', limit: 100 }), ''];
      addMeta('reference', [k1, k2], async () => {
        const response = await call((c) => productsApi.getAll(1, 100, {}, [], c));
        store(k1, response);
        store(k2, response?.data?.data ?? []);
      });
    }
    if (can(Action.CATEGORIES_VIEW)) {
      const kFilters = queryKeys.options('categories', { scope: 'filters', limit: 100 });
      addMeta('reference', [kFilters], async () =>
        store(kFilters, await call((c) => categoriesApi.getAll(1, 100, {}, [], c)))
      );
      if (canAccess(role, '/products/create')) {
        const kForm = [...queryKeys.options('categories', { scope: 'form', limit: 20 }), ''];
        addMeta('reference', [kForm], async () =>
          store(kForm, (await call((c) => categoriesApi.getAll(1, 20, {}, [], c)))?.data?.data ?? [])
        );
      }
    }
    if (can(Action.SELLERS_VIEW)) {
      const kFilters = queryKeys.options('sellers', { scope: 'filters', limit: 100 });
      addMeta('reference', [kFilters], async () =>
        store(kFilters, await call((c) => sellersApi.getAll(1, 100, {}, [], c)))
      );
      if (can(Action.DASHBOARDS_VIEW)) {
        const kBar = [...queryKeys.options('sellers', { scope: 'filter-bar', limit: 20 }), ''];
        addMeta('reference', [kBar], async () =>
          store(kBar, (await call((c) => sellersApi.getAll(1, 20, {}, [], c)))?.data?.data ?? [])
        );
      }
    }
    if (can(Action.MARKETS_VIEW) && can(Action.USERS_VIEW)) {
      const kMarketForm = queryKeys.options('markets', { scope: 'user-form', limit: 100 });
      addMeta('reference', [kMarketForm], async () =>
        store(kMarketForm, await call((c) => marketsApi.getAll(1, 100, {}, [], c)))
      );
    }
    if (can(Action.USERS_VIEW)) {
      const owners: ActiveFilter[] = [{ key: 'role', value: Role.Owner }];
      const kOwners100 = queryKeys.options('users', { scope: 'owners', limit: 100 });
      const kOwners20 = [...queryKeys.options('users', { scope: 'owners', limit: 20 }), ''];
      addMeta('reference', [kOwners100], async () =>
        store(kOwners100, await call((c) => usersApi.getAll(1, 100, {}, owners, c)))
      );
      addMeta('reference', [kOwners20], async () =>
        store(kOwners20, (await call((c) => usersApi.getAll(1, 20, {}, owners, c)))?.data?.data ?? [])
      );
    }
  } // full

  // Списки: первая пачка каждой сущности, которая реально требует обновления.
  // Для ownMarketOnly список рынков недоступен (403), поэтому исключаем его из списочных задач.
  const entities = entitiesToSync.filter(
    (spec) => roleCan(role, spec.listAction) && canAccess(role, `/${spec.entity}`)
  );
  const listRowsByEntity = new Map<Entity, Array<Record<string, unknown> & { id: string }>>();
  const serverTotals = new Map<Entity, number>();
  // Сохраняем старые закешированные строки до перезаписи пачкой №1, чтобы понять, сдвинулись ли страницы 2..N.
  const cachedRowsBeforeSync = new Map<Entity, Array<Record<string, unknown> & { id: string }>>();
  for (const spec of entities) {
    cachedRowsBeforeSync.set(spec.entity, getCachedListRows(queryClient, spec.entity).rows);
  }

  /** Нарезает пачку из 100 строк на страницы по 10 — ключи кеша точно такие же, как у таблиц. */
  const seedListPages = (
    entity: Entity,
    chunkPage: number,
    response: ApiResponse<PaginatedData<Record<string, unknown> & { id: string }>>
  ) => {
    const rows = response?.data?.data ?? [];
    const total = response?.data?.meta?.total ?? rows.length;
    const per = DEFAULT_PAGE_LIMIT;
    const totalPages = Math.max(1, Math.ceil(total / per));
    const pagesInChunk = CHUNK_SIZE / per;

    for (let i = 0; i < pagesInChunk; i++) {
      const slice = rows.slice(i * per, (i + 1) * per);
      const page = (chunkPage - 1) * pagesInChunk + i + 1;
      if (slice.length === 0 && !(chunkPage === 1 && i === 0)) break;
      store(queryKeys.list(entity, { page, limit: per, search: '', filters: [] }), {
        ...response,
        data: { data: slice, meta: { page, limit: per, total, totalPages } },
      });
    }

    const existing = listRowsByEntity.get(entity) ?? [];
    for (const row of rows) existing.push(row);
    listRowsByEntity.set(entity, existing);
    serverTotals.set(entity, total);
  };

  const listChunk = (spec: EntitySpec, chunkPage: number) => async (): Promise<'done'> => {
    const response = (await call((c) =>
      spec.list(chunkPage, CHUNK_SIZE, spec.defaultSort ?? { sortBy: 'createdAt', sortOrder: 'desc' }, [], c)
    )) as ApiResponse<PaginatedData<Record<string, unknown> & { id: string }>>;
    seedListPages(spec.entity, chunkPage, response);
    return 'done';
  };

  for (const spec of entities) {
    plan(spec.entity, 1);
    tasks1.push({ group: spec.entity, run: listChunk(spec, 1) });
  }

  // Своя карточка рынка для ролей, которым список рынков недоступен (владелец, продавец).
  const marketSpec = ENTITY_SPECS.find((spec) => spec.entity === 'markets')!;
  const ownMarketOnly =
    (full || scope === 'markets') &&
    !roleCan(role, marketSpec.listAction) &&
    Boolean(marketId) &&
    can(Action.MARKETS_VIEW_BY_ID);
  if (ownMarketOnly) {
    const ownMarketKey = queryKeys.full('markets', marketId);
    const ownMarketState = queryClient.getQueryState(ownMarketKey);
    const hasValidOverview = Boolean(
      ownMarketState &&
        !ownMarketState.isInvalidated &&
        (ownMarketState.data as ApiResponse<{ summary?: unknown }> | undefined)?.data?.summary
    );
    if (!hasValidOverview) {
      plan('markets', 1);
      tasks1.push({
        group: 'markets',
        run: async () => {
          store(ownMarketKey, await call((c) => marketSpec.detail(marketId, c)));
          return 'done';
        },
      });
    }
  }

  // ---- запуск ----
  emit(true);
  try {
    // Этап 1: всё мелкое + первые пачки списков → становится известен полный объём.
    await runPool(tasks1);
    if (fatal) throw fatal;

    // Этап 2: оставшиеся пачки списков (2..chunks).
    // Если первая пачка (100 строк) закончилась на том же id, что был на 100-й позиции в кеше,
    // и страницы 11..N уже валидны в кеше — не перезагружаем старые страницы заново.
    const tasks2: Task[] = [];
    for (const spec of entities) {
      const total = serverTotals.get(spec.entity) ?? 0;
      const cappedTotal = Math.min(total, MAX_LIST_ROWS);
      const chunks = Math.ceil(cappedTotal / CHUNK_SIZE);
      if (chunks <= 1) continue;

      const prevRows = cachedRowsBeforeSync.get(spec.entity) ?? [];
      const newFirstChunk = listRowsByEntity.get(spec.entity) ?? [];
      const tailUnchanged =
        prevRows.length >= cappedTotal &&
        newFirstChunk.length === CHUNK_SIZE &&
        prevRows[CHUNK_SIZE - 1]?.id === newFirstChunk[CHUNK_SIZE - 1]?.id;

      if (tailUnchanged) {
        // Сохраняем уже закешированные строки 101..N для проверки карточек на этапе 3.
        listRowsByEntity.set(spec.entity, [...newFirstChunk, ...prevRows.slice(CHUNK_SIZE, cappedTotal)]);
        continue;
      }

      for (let chunkPage = 2; chunkPage <= chunks; chunkPage++) {
        plan(spec.entity, 1);
        tasks2.push({ group: spec.entity, run: listChunk(spec, chunkPage) });
      }
    }

    await runPool(tasks2);
    if (fatal) throw fatal;

    // Этап 3: карточки. Планируем и качаем ТОЛЬКО те карточки, которых ещё нет в кеше,
    // которые помечены как `isInvalidated`, или у которых данные в списке отличаются от карточки.
    const detailTasks: Task[] = [];
    const pendingByEntity = entities
      .filter((spec) => canSyncDetails(spec, role))
      .map((spec) => {
        const count = Math.min(serverTotals.get(spec.entity) ?? 0, spec.detailCap);
        const rows = (listRowsByEntity.get(spec.entity) ?? []).slice(0, count);
        const missingRows = rows.filter((row) => !isDetailUpToDate(queryClient, spec, row.id, row));
        return { spec, missingRows };
      });

    for (const { spec, missingRows } of pendingByEntity) {
      plan(spec.entity, missingRows.length);
    }

    snapshot.phase = 'running';
    emit(true);

    // Идём «по кругу» по сущностям, чтобы при обрыве у каждой было хоть что-то.
    for (let i = 0; pendingByEntity.some(({ missingRows }) => i < missingRows.length); i++) {
      for (const { spec, missingRows } of pendingByEntity) {
        if (i >= missingRows.length) continue;
        const row = missingRows[i];
        const key = queryKeys[spec.detailKind](spec.entity, row.id);
        detailTasks.push({
          group: spec.entity,
          run: async () => {
            if (isDetailUpToDate(queryClient, spec, row.id, row)) return 'skipped';
            store(key, await call((c) => spec.detail(row.id, c)));
            return 'done';
          },
        });
      }
    }

    await runPool(detailTasks);
    if (fatal) throw fatal;
  } catch (error) {
    fatal = error as Error;
  }

  if (trailing) clearTimeout(trailing);
  await flushPersistedCache();

  let outcome: SyncOutcome;
  if (fatal instanceof AbortedError) outcome = 'cancelled';
  else if (fatal instanceof ThrottledError) outcome = 'throttled';
  else if (fatal instanceof UnauthorizedError) outcome = 'unauthorized';
  else if (fatal) throw fatal;
  else outcome = snapshot.failed > 0 ? 'partial' : 'complete';

  snapshot.waitingNetwork = false;
  snapshot.throttledUntil = null;
  emit(true);

  if (outcome === 'complete' || outcome === 'partial') {
    await writeLastSync(scope, {
      finishedAt: Date.now(),
      outcome,
      done: snapshot.done,
      total: snapshot.total,
      failed: snapshot.failed,
    });
  }
  return outcome;
}
