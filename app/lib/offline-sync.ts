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
    detail: marketsApi.getFull as DetailFn,
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
}

export function getEntityCoverage(queryClient: QueryClient, spec: EntitySpec): EntityCoverage {
  const firstPage = queryClient.getQueryState<ApiResponse<PaginatedData<unknown>>>(
    queryKeys.list(spec.entity, { page: 1, limit: DEFAULT_PAGE_LIMIT, search: '', filters: [] })
  );
  const total = firstPage?.data?.data?.meta?.total ?? null;
  const details = queryClient
    .getQueryCache()
    .findAll({ queryKey: [spec.entity, spec.detailKind] })
    .filter((query) => query.state.data !== undefined).length;

  return {
    entity: spec.entity,
    total,
    details,
    target: total === null ? null : Math.min(total, spec.detailCap),
    updatedAt: firstPage?.dataUpdatedAt ?? null,
  };
}

/**
 * Актуальна ли сущность прямо сейчас: список грузили недавно (в пределах
 * `FRESH_WINDOW_MS`) и карточек в кеше столько же, сколько мы для неё хотим
 * иметь. Используется, чтобы отключать кнопку «Обновить»/«Синхронизировать
 * всё», когда качать уже нечего.
 */
export function isEntityUpToDate(queryClient: QueryClient, spec: EntitySpec, role: Role): boolean {
  if (!canSyncEntity(spec, role)) return true; // роль её не синхронизирует — не блокируем кнопку этим
  const coverage = getEntityCoverage(queryClient, spec);
  if (coverage.target === null || coverage.updatedAt === null) return false;
  if (Date.now() - coverage.updatedAt >= FRESH_WINDOW_MS) return false;
  return coverage.details >= coverage.target;
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
  const isFresh = (key: QueryKey) => {
    const updatedAt = queryClient.getQueryState(key)?.dataUpdatedAt ?? 0;
    return Date.now() - updatedAt < FRESH_WINDOW_MS;
  };

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
  const addMeta = (id: 'profile' | 'dashboard' | 'reference', run: () => Promise<unknown>) => {
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
    // Профиль: шапка читает compact `me`, страница профиля — `full`.
    addMeta('profile', async () => store(queryKeys.me(), await call((c) => profileApi.getProfile(c))));
    addMeta('profile', async () => store(queryKeys.profile(), await call((c) => profileApi.getFullProfile(c))));

    // Дашборд — для периода по умолчанию (то, что видно при первом заходе).
    if (can(Action.DASHBOARDS_VIEW)) {
      const params = { period: 'month' };
      addMeta('dashboard', async () =>
        store(queryKeys.dashboard('overview', params), await call((c) => dashboardApi.getOverview(params, c)))
      );
      addMeta('dashboard', async () =>
        store(
          queryKeys.dashboard('recent-transactions', { sellerId: undefined }),
          await call((c) => transactionsApi.getAll(1, 5, { sortBy: 'createdAt', sortOrder: 'desc' }, [], c))
        )
      );
      addMeta('dashboard', async () =>
        store(
          queryKeys.dashboard('sellers-report', params),
          await call((c) => dashboardApi.getSellersReport(params, c))
        )
      );
    }

    // Справочники. Ключи и форма данных — ровно те, что читают экраны (см. комментарий у каждого):
    // выпадающие списки через useAsyncSelectOptions хранят МАССИВ строк под ключом с хвостом '' (пустой поиск),
    // фильтры и превью читают ПОЛНЫЙ ответ API.
    if (can(Action.DEBTORS_VIEW)) {
      addMeta('reference', async () => {
        const response = await call((c) => debtorsApi.getAll(1, 100, {}, [], c));
        store(queryKeys.options('debtors', { scope: 'filters', limit: 100 }), response); // транзакции: фильтр
        store([...queryKeys.options('debtors', { scope: 'form', limit: 100 }), ''], response?.data?.data ?? []); // новая транзакция
      });
      if (marketId) {
        addMeta('reference', async () =>
          store(
            queryKeys.options('debtors', { scope: 'profile', marketId, limit: 5 }),
            await call((c) => debtorsApi.getAll(1, 5, {}, [], c))
          )
        );
      }
    }
    if (can(Action.PRODUCTS_VIEW)) {
      addMeta('reference', async () => {
        const response = await call((c) => productsApi.getAll(1, 100, {}, [], c));
        store(queryKeys.options('products', { scope: 'filters', limit: 100 }), response);
        store([...queryKeys.options('products', { scope: 'form', limit: 100 }), ''], response?.data?.data ?? []);
      });
      if (marketId) {
        addMeta('reference', async () =>
          store(
            queryKeys.options('products', { scope: 'profile', marketId, limit: 5 }),
            await call((c) => productsApi.getAll(1, 5, {}, [], c))
          )
        );
      }
    }
    if (can(Action.CATEGORIES_VIEW)) {
      addMeta('reference', async () =>
        store(
          queryKeys.options('categories', { scope: 'filters', limit: 100 }),
          await call((c) => categoriesApi.getAll(1, 100, {}, [], c))
        )
      );
      if (canAccess(role, '/products/create')) {
        addMeta('reference', async () =>
          store(
            [...queryKeys.options('categories', { scope: 'form', limit: 20 }), ''],
            (await call((c) => categoriesApi.getAll(1, 20, {}, [], c)))?.data?.data ?? []
          )
        );
      }
    }
    if (can(Action.SELLERS_VIEW)) {
      addMeta('reference', async () =>
        store(
          queryKeys.options('sellers', { scope: 'filters', limit: 100 }),
          await call((c) => sellersApi.getAll(1, 100, {}, [], c))
        )
      );
      if (can(Action.DASHBOARDS_VIEW)) {
        addMeta('reference', async () =>
          store(
            [...queryKeys.options('sellers', { scope: 'filter-bar', limit: 20 }), ''],
            (await call((c) => sellersApi.getAll(1, 20, {}, [], c)))?.data?.data ?? []
          )
        );
      }
    }
    if (can(Action.MARKETS_VIEW) && can(Action.USERS_VIEW)) {
      addMeta('reference', async () =>
        store(
          queryKeys.options('markets', { scope: 'user-form', limit: 100 }),
          await call((c) => marketsApi.getAll(1, 100, {}, [], c))
        )
      );
    }
    if (can(Action.USERS_VIEW)) {
      const owners: ActiveFilter[] = [{ key: 'role', value: Role.Owner }];
      addMeta('reference', async () =>
        store(
          queryKeys.options('users', { scope: 'owners', limit: 100 }),
          await call((c) => usersApi.getAll(1, 100, {}, owners, c))
        )
      );
      addMeta('reference', async () =>
        store(
          [...queryKeys.options('users', { scope: 'owners', limit: 20 }), ''],
          (await call((c) => usersApi.getAll(1, 20, {}, owners, c)))?.data?.data ?? []
        )
      );
    }
  } // full

  // Списки: первая пачка каждой сущности. Из неё сразу видно, сколько всего записей.
  // Если scope — конкретная сущность, синхронизируем только её.
  const entities = ENTITY_SPECS.filter((spec) => (full || spec.entity === scope) && canSyncEntity(spec, role));
  const rowIds = new Map<Entity, string[]>();
  const serverTotals = new Map<Entity, number>();

  /** Нарезает пачку из 100 строк на страницы по 10 — ключи кеша точно такие же, как у таблиц. */
  const seedListPages = (entity: Entity, chunkPage: number, response: ApiResponse<PaginatedData<{ id: string }>>) => {
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

    const ids = rowIds.get(entity) ?? [];
    for (const row of rows) ids.push(row.id);
    rowIds.set(entity, ids);
    serverTotals.set(entity, total);
  };

  const listChunk = (spec: EntitySpec, chunkPage: number) => async (): Promise<'done'> => {
    const response = await call((c) =>
      spec.list(chunkPage, CHUNK_SIZE, { sortBy: 'createdAt', sortOrder: 'desc' }, [], c)
    );
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
    !entities.includes(marketSpec) &&
    Boolean(marketId) &&
    can(Action.MARKETS_VIEW_BY_ID);
  if (ownMarketOnly) {
    plan('markets', 1);
    tasks1.push({
      group: 'markets',
      run: async () => {
        store(queryKeys.full('markets', marketId), await call((c) => marketSpec.detail(marketId, c)));
        return 'done';
      },
    });
  }

  // ---- запуск ----
  emit(true);
  try {
    // Этап 1: всё мелкое + первые пачки списков → становится известен полный объём.
    await runPool(tasks1);
    if (fatal) throw fatal;

    // Этап 2: оставшиеся пачки списков.
    const tasks2: Task[] = [];
    for (const spec of entities) {
      const total = serverTotals.get(spec.entity) ?? 0;
      const chunks = Math.ceil(Math.min(total, MAX_LIST_ROWS) / CHUNK_SIZE);
      for (let chunkPage = 2; chunkPage <= chunks; chunkPage++) {
        plan(spec.entity, 1);
        tasks2.push({ group: spec.entity, run: listChunk(spec, chunkPage) });
      }
    }

    // Этап 3: карточки. Идём «по кругу» по сущностям, чтобы при обрыве у каждой было хоть что-то.
    const detailTasks: Task[] = [];
    const queues = entities
      .filter((spec) => canSyncDetails(spec, role))
      .map((spec) => ({ spec, count: Math.min(serverTotals.get(spec.entity) ?? 0, spec.detailCap) }));
    for (const { spec, count } of queues) plan(spec.entity, count);

    snapshot.phase = 'running';
    emit(true);

    await runPool(tasks2);
    if (fatal) throw fatal;

    for (let i = 0; queues.some(({ count }) => i < count); i++) {
      for (const { spec, count } of queues) {
        if (i >= count) continue;
        const id = rowIds.get(spec.entity)?.[i];
        if (!id) {
          // Список оказался короче, чем сообщил total (записи удалили на лету) — не держим прогресс незавершённым.
          detailTasks.push({ group: spec.entity, run: async () => 'skipped' });
          continue;
        }
        const key = queryKeys[spec.detailKind](spec.entity, id);
        detailTasks.push({
          group: spec.entity,
          run: async () => {
            if (isFresh(key)) return 'skipped';
            store(key, await call((c) => spec.detail(id, c)));
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
