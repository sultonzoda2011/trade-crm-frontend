import { QueryClient, keepPreviousData } from "@tanstack/react-query";

// 400 дней — персистентный кеш (см. query-persister.ts) должен переживать
// даже очень долгий офлайн (по задаче — "запрос год назад, но показать
// кеш"), поэтому gcTime должен быть больше maxAge дехидрации, иначе
// react-query выкинет query из памяти раньше, чем успеет его сохранить.
export const PERSISTED_GC_TIME = 1000 * 60 * 60 * 24 * 400;

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: PERSISTED_GC_TIME,
        // Keep showing the previous page/filter results while the next request
        // is in flight — paginated tables stay on screen instead of flashing
        // skeletons. First load is unaffected (no previous data to show).
        placeholderData: keepPreviousData,
        retry: 2,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

const browserQueryClient = makeQueryClient();

export function getQueryClient() {
  return browserQueryClient;
}
