import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
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

export function useFilterParams({
  page, limit, search, filters,
  setPage, setLimit, setSearch, setFilters,
  filterConfigs,
}: UseFilterParamsOptions) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const urlPage = searchParams.get('page');
    const urlLimit = searchParams.get('limit');
    const urlSearch = searchParams.get('search');

    const urlFilters: ActiveFilter[] = [];

    for (const config of filterConfigs) {
      if (config.type === 'date-range') {
        const from = searchParams.get(config.keyFrom);
        const to = searchParams.get(config.keyTo);
        if (from) urlFilters.push({ key: config.keyFrom, value: from });
        if (to) urlFilters.push({ key: config.keyTo, value: to });
      } else if (config.type === 'number-range') {
        const from = searchParams.get(config.keyFrom);
        const to = searchParams.get(config.keyTo);
        if (from) urlFilters.push({ key: config.keyFrom, value: from });
        if (to) urlFilters.push({ key: config.keyTo, value: to });
      } else if ('key' in config && config.key) {
        const value = searchParams.get(config.key);
        if (value) urlFilters.push({ key: config.key, value });
      }
    }

    if (urlPage) setPage(Number(urlPage));
    if (urlLimit) setLimit(Number(urlLimit));
    if (urlSearch) setSearch(urlSearch);
    if (urlFilters.length > 0) setFilters(urlFilters);
  }, []);

  useEffect(() => {
    if (!initialized.current) return;

    const params = new URLSearchParams();
    if (page > 1) params.set('page', String(page));
    if (limit !== 10) params.set('limit', String(limit));
    if (search) params.set('search', search);
    for (const f of filters) {
      if (f.key && (typeof f.value === 'string' || typeof f.value === 'number')) {
        params.set(f.key, String(f.value));
      }
    }
    setSearchParams(params, { replace: true });
  }, [page, limit, search, filters, setSearchParams]);
}
