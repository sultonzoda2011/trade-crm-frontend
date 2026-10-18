import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import * as React from 'react';
import type { CustomSelectOption } from '~/components/shared/CustomSelect';
import { useDebounce } from '~/hooks/useDebounce';
import { useNetworkStatus } from '~/hooks/useNetworkStatus';

const EMPTY: readonly never[] = [];

interface AsyncSelectConfig<T> {
  /** Stable prefix for the react-query key; the debounced search term is appended automatically. */
  queryKey: readonly unknown[];
  /** Fetches entities for a search string. Called with `''` for the initial/default page. */
  fetcher: (search: string) => Promise<T[]>;
  /** Extracts the option value from an entity (usually its id). */
  getValue: (item: T) => string | number;
  /** Extracts the visible label from an entity. */
  getLabel: (item: T) => string;
  /** Preselected entities to always keep available (needed by edit forms so the current value has a label). */
  seed?: T[];
  /** Disable the query until ready (e.g. modal not open, id not loaded yet). */
  enabled?: boolean;
  /** Debounce before firing the API request. Default 300ms. */
  debounceMs?: number;
  /** react-query staleTime. Default 30s. */
  staleTime?: number;
  /**
   * Сущность, чьи сохранённые на устройстве списки служат запасным источником без сети и на слабой
   * связи. По умолчанию — первый элемент `queryKey` (он же ключ сущности в query-keys.ts).
   */
  entity?: string;
  /**
   * Подходит ли запись этому списку. Нужно, когда выбор — подмножество сущности (например, только
   * владельцы среди пользователей): запасной источник собирает записи из ВСЕХ сохранённых запросов
   * сущности, и без фильтра в список попали бы лишние.
   */
  accept?: (item: T) => boolean;
  /** Текст, по которому ищем на устройстве. По умолчанию — подпись; для людей полезно добавить телефон. */
  getSearchText?: (item: T) => string;
}

interface AsyncSelectResult<T> {
  /** Options for the current search (plus any seed), de-duplicated — pass to `<FormCustomSelect options>`. */
  options: CustomSelectOption[];
  /**
   * Every entity seen so far (current results ∪ all previously fetched ∪ seed), keyed by String(value).
   * Use this — never just the latest page — whenever you need an entity's full data (price, stock, …)
   * for an already-selected value, since server-side search narrows the current results.
   */
  byId: Map<string, T>;
  /** Pass to `<FormCustomSelect onSearch>`; updates the (debounced) query term. */
  onSearch: (query: string) => void;
  /** True while a request is in flight — pass to `<FormCustomSelect loading>`. */
  loading: boolean;
  /** Показываются ли сейчас данные с устройства, а не ответ сервера: нет сети или сервер ещё не ответил. */
  fromDevice: boolean;
  /** Когда результаты последний раз пришли с сервера — по нему оверлей очереди понимает, что список уже догнал её. */
  dataUpdatedAt: number;
}

/** Не больше стольких записей с устройства в одном списке — шторка не должна рисовать тысячи строк. */
const LOCAL_LIMIT = 100;

/**
 * Записи сущности из всего, что лежит в кеше (в том числе восстановленном с диска): страницы таблиц
 * (`list`) и справочники (`options`). Выпадающий список не должен зависеть от того, какой именно
 * ключ кеша совпал: если сущность хоть раз загружалась или синхронизировалась, её записи годятся
 * для выбора без сети и на слабой связи.
 */
function collectCached<T>(queryClient: QueryClient, entity: string, getValue: (item: T) => string | number): T[] {
  const found = new Map<string, T>();
  const add = (rows: unknown) => {
    if (!Array.isArray(rows)) return;
    for (const row of rows) {
      if (typeof row !== 'object' || row === null) continue;
      const value = getValue(row as T);
      if (value === undefined || value === null || value === '') continue;
      found.set(String(value), row as T);
    }
  };

  for (const [key, data] of queryClient.getQueriesData<unknown>({ queryKey: [entity] })) {
    const kind = key[1];
    if (kind !== 'list' && kind !== 'options') continue;
    const body = data as { data?: { data?: unknown } | unknown } | unknown[] | undefined;
    if (Array.isArray(body)) add(body); // справочник из sync: массив записей
    else if (Array.isArray(body?.data)) add(body.data); // ответ API без пагинации
    else add((body?.data as { data?: unknown } | undefined)?.data); // страница таблицы / ответ API с пагинацией
  }
  return [...found.values()];
}

/**
 * Server-side (API) search for a select/combobox.
 *
 * Holds the typed query, debounces it, runs a react-query request per term and maps the
 * results to `{ value, label }` options. Because the server only returns matching rows,
 * it also accumulates every entity ever fetched into `byId` so previously-selected values
 * keep their label and data even after the visible results narrow.
 *
 * The matching `<CustomSelect onSearch>` disables base-ui's local filter, so the list shows
 * exactly what the server returned (no double filtering).
 */
export function useAsyncSelectOptions<T>(config: AsyncSelectConfig<T>): AsyncSelectResult<T> {
  const {
    fetcher,
    getValue,
    getLabel,
    seed,
    queryKey,
    enabled = true,
    debounceMs = 300,
    staleTime = 30_000,
    entity = typeof queryKey[0] === 'string' ? queryKey[0] : undefined,
    accept,
    getSearchText,
  } = config;
  const queryClient = useQueryClient();
  const isOnline = useNetworkStatus();

  const [search, setSearch] = React.useState('');
  const debounced = useDebounce(search, debounceMs);

  const query = useQuery({
    queryKey: [...queryKey, debounced],
    queryFn: () => fetcher(debounced),
    enabled,
    staleTime,
  });

  // Ответ сервера по ЭТОМУ запросу. keepPreviousData подставляет прошлый поиск на время загрузки —
  // это не ответ на текущий ввод, поэтому такие данные за «серверные» не считаем.
  const serverData = query.isPlaceholderData ? undefined : (query.data as T[] | undefined);
  // С устройства берём, когда сети нет или сервер ещё не ответил (слабая связь): человек сразу видит
  // и может искать, а не смотрит на «Загрузка…». Ответ сервера, когда придёт, заменит этот список.
  const useDevice = !!entity && (!isOnline || serverData === undefined);

  // Кеш меняется (идёт синхронизация, восстановился диск) — пересобираем запасной список.
  const [cacheTick, setCacheTick] = React.useState(0);
  React.useEffect(() => {
    if (!useDevice || !entity) return;
    return queryClient.getQueryCache().subscribe((event) => {
      if (event.type !== 'added' && event.type !== 'updated') return;
      if (event.query.queryKey[0] === entity) setCacheTick((n) => n + 1);
    });
  }, [useDevice, entity, queryClient]);

  const deviceItems = React.useMemo<T[]>(() => {
    if (!useDevice || !entity) return [];
    const needle = search.trim().toLowerCase();
    const exact = (query.data as T[] | undefined) ?? [];
    const pool = new Map<string, T>();
    for (const item of [...exact, ...collectCached<T>(queryClient, entity, getValue)]) {
      if (accept && !accept(item)) continue;
      pool.set(String(getValue(item)), item);
    }
    const matches = [...pool.values()].filter(
      (item) => !needle || (getSearchText ? getSearchText(item) : getLabel(item)).toLowerCase().includes(needle)
    );
    return matches.slice(0, LOCAL_LIMIT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useDevice, entity, search, query.data, cacheTick, queryClient]);

  // Данных с устройства нет, а прошлый поиск на экране есть — не мигаем пустотой.
  const results = (
    useDevice && (deviceItems.length > 0 || !query.data) ? deviceItems : (serverData ?? query.data ?? EMPTY)
  ) as T[];

  // Накопление идёт синхронно в рендере, а не в useEffect: потребители читают цену/остаток
  // выбранного товара из `byId` в этом же рендере, и effect-обновление пришло бы на рендер
  // позже — итог посчитался бы по пустой карте.
  const seenRef = React.useRef<Map<string, T>>(new Map());
  const versionRef = React.useRef(0);
  let grew = false;
  for (const item of seed ?? []) {
    const key = String(getValue(item));
    if (!seenRef.current.has(key)) {
      seenRef.current.set(key, item);
      grew = true;
    }
  }
  // Свежий ответ сервера заменяет то, что накопилось раньше: после обновления списка (скажем, когда
  // продажа из очереди списала остатки) в `byId` должны лежать новые цифры, а не те, что были при первом показе.
  // Structural sharing у react-query сохраняет ссылку на неизменившиеся элементы, поэтому лишних перерисовок нет.
  for (const item of results) {
    const key = String(getValue(item));
    if (seenRef.current.get(key) !== item) {
      seenRef.current.set(key, item);
      grew = true;
    }
  }
  // Bump only when the set actually grew, so `byId` gets a new identity exactly when needed.
  if (grew) versionRef.current += 1;
  const byId = React.useMemo(() => new Map(seenRef.current), [versionRef.current]);

  // Visible options = seed ∪ current results, de-duplicated, order-preserving.
  const options = React.useMemo<CustomSelectOption[]>(() => {
    const seen = new Set<string>();
    const list: CustomSelectOption[] = [];
    for (const item of [...(seed ?? []), ...results]) {
      const key = String(getValue(item));
      if (seen.has(key)) continue;
      seen.add(key);
      list.push({ value: getValue(item), label: getLabel(item) });
    }
    return list;
  }, [results, seed]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    options,
    byId,
    onSearch: setSearch,
    loading: query.isFetching,
    fromDevice: useDevice,
    dataUpdatedAt: query.dataUpdatedAt,
  };
}
