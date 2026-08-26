import { useQuery } from '@tanstack/react-query';
import * as React from 'react';
import type { CustomSelectOption } from '~/components/shared/CustomSelect';
import { useDebounce } from '~/hooks/useDebounce';

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
  const { fetcher, getValue, getLabel, seed, queryKey, enabled = true, debounceMs = 300, staleTime = 30_000 } = config;

  const [search, setSearch] = React.useState('');
  const debounced = useDebounce(search, debounceMs);

  const query = useQuery({
    queryKey: [...queryKey, debounced],
    queryFn: () => fetcher(debounced),
    enabled,
    staleTime,
  });

  const results = (query.data ?? EMPTY) as T[];

  // Accumulate every entity we've ever seen so a row that already picked an item keeps its
  // label/price/stock even after the search narrows `results` to something else.
  //
  // This is done *synchronously during render* (not in a useEffect) on purpose: consumers like
  // the transaction form read a selected product's price straight out of `byId` to compute the
  // payment total. An effect-based update lands one render late, so the total could read a
  // still-empty map and compute 0. Updating the ref inline keeps `byId` in lockstep with
  // `results` — same guarantee the old synchronous `productMap` had.
  const seenRef = React.useRef<Map<string, T>>(new Map());
  const versionRef = React.useRef(0);
  let grew = false;
  for (const item of [...(seed ?? []), ...results]) {
    const key = String(getValue(item));
    if (!seenRef.current.has(key)) {
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

  return { options, byId, onSearch: setSearch, loading: query.isFetching };
}
