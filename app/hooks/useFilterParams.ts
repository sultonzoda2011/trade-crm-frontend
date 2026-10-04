import { useEffect, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { DEFAULT_PAGE_LIMIT } from '~/store/useTableStore';
import type { ActiveFilter, FilterConfig } from '~/types/filters';

interface UseFilterParamsOptions {
  page: number;
  limit: number;
  search: string;
  filters: ActiveFilter[];
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  setFilters: (filters: ActiveFilter[]) => void;
  filterConfigs: FilterConfig[];
}

/** Which URL param names a config array is able to hydrate. */
function hydratableKeys(configs: FilterConfig[]): string[] {
  return configs.flatMap((config) => {
    if (config.type === 'date-range' || config.type === 'number-range') return [config.keyFrom, config.keyTo];
    return 'key' in config && config.key ? [config.key] : [];
  });
}

function readUrlFilters(configs: FilterConfig[], search: URLSearchParams): ActiveFilter[] {
  const out: ActiveFilter[] = [];
  for (const config of configs) {
    if (config.type === 'date-range' || config.type === 'number-range') {
      const from = search.get(config.keyFrom);
      const to = search.get(config.keyTo);
      if (from) out.push({ key: config.keyFrom, value: from });
      if (to) out.push({ key: config.keyTo, value: to });
    } else if ('key' in config && config.key) {
      const value = search.get(config.key);
      if (value) out.push({ key: config.key, value });
    }
  }
  return out;
}

/**
 * Two-way sync between a table store and the query string, so a list page is
 * linkable and survives a reload.
 *
 * Three things this had to learn:
 *
 * 1. `limit` used to be compared against a literal `10` that was a fourth copy
 *    of the default page size; it now reads `DEFAULT_PAGE_LIMIT`.
 * 2. The read and write effects both ran in the first commit, and the writer —
 *    seeing `initialized.current` already true — flushed the store's
 *    *pre-hydration* defaults over the params the reader had just consumed, so
 *    `?page=3` landed then vanished from the URL. The writer is now gated on a
 *    `ready` flag that flips only after hydration, so its first run sees
 *    hydrated values instead of defaults.
 * 3. The reader used to snapshot `filterConfigs` from the mount render. Pages
 *    whose select filters come from an async list (products, transactions) had
 *    an option-less config on mount, so a deep-linked `?categoryId=`/`?debtorId=`
 *    was silently dropped. Hydration now re-runs whenever the set of hydratable
 *    keys grows, and reads configs from a ref. Re-applying is safe: once the
 *    writer is running, the query string mirrors the store.
 */
export function useFilterParams({
  page,
  limit,
  search,
  filters,
  setPage,
  setLimit,
  setSearch,
  setFilters,
  filterConfigs,
}: UseFilterParamsOptions) {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const freshListRef = useRef(false);
  freshListRef.current = Boolean((location.state as { freshList?: boolean } | null)?.freshList);
  const configsRef = useRef(filterConfigs);
  configsRef.current = filterConfigs;

  const [ready, setReady] = useState(false);
  const hydratedFor = useRef<string>('');

  const keys = hydratableKeys(filterConfigs).join(',');

  useEffect(() => {
    if (hydratedFor.current === keys) return;
    hydratedFor.current = keys;

    const urlPage = searchParams.get('page');
    const urlLimit = searchParams.get('limit');
    const urlSearch = searchParams.get('search');
    const urlFilters = readUrlFilters(configsRef.current, searchParams);

    // setLimit/setSearch/setFilters всегда сбрасывают страницу на 1, поэтому
    // страница применяется последней — иначе `?page=3&type=SALE` терял page.
    if (urlLimit) setLimit(Number(urlLimit));
    if (urlSearch) setSearch(urlSearch);
    if (urlFilters.length > 0) setFilters(urlFilters);
    // Ссылка «все …» с дашборда без параметров: список был открыт раньше с
    // другими фильтрами, а store живёт между переходами — без сброса карточка
    // «Всего товаров: 120» открывала бы урезанный список.
    else if (freshListRef.current) setFilters([]);
    if (urlPage) setPage(Number(urlPage));

    setReady(true);
  }, [keys, searchParams, setPage, setLimit, setSearch, setFilters]);

  useEffect(() => {
    if (!ready) return;

    const params = new URLSearchParams();
    if (page > 1) params.set('page', String(page));
    if (limit !== DEFAULT_PAGE_LIMIT) params.set('limit', String(limit));
    if (search) params.set('search', search);
    for (const f of filters) {
      if (f.key && (typeof f.value === 'string' || typeof f.value === 'number')) {
        params.set(f.key, String(f.value));
      }
    }
    setSearchParams(params, { replace: true });
  }, [ready, page, limit, search, filters, setSearchParams]);
}
