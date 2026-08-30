import { QueryClient, keepPreviousData } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { getIsOnline } from "~/lib/offline/networkStatus";

/**
 * gcTime должен быть >= maxAge персистера, иначе кэш выкидывается из памяти
 * до того, как успевает сохраниться на диск. Держим данные сутки — этого
 * достаточно, чтобы открыть приложение без интернета и увидеть последние
 * загруженные списки/детали.
 */
const OFFLINE_CACHE_MS = 24 * 60 * 60 * 1000; // 24 часа

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: OFFLINE_CACHE_MS,
        // offlineFirst: если сети нет, React Query сразу отдаёт то, что есть
        // в кэше, вместо бесконечного "loading" в ожидании запроса.
        networkMode: "offlineFirst",
        // Keep showing the previous page/filter results while the next request
        // is in flight — paginated tables stay on screen instead of flashing
        // skeletons. First load is unaffected (no previous data to show).
        placeholderData: keepPreviousData,
        retry: (failureCount, error: any) => {
          // Без сети смысла ретраить нет — сразу отдаём кэш/ошибку.
          if (!getIsOnline()) return false;
          return failureCount < 2;
        },
      },
      mutations: {
        // ВАЖНО: было "online" — при таком режиме React Query вообще не
        // вызывает mutationFn без сети (мутация просто "зависает" в
        // isPaused), а именно внутри mutationFn (api/transactions.ts,
        // api/products.ts, api/debtors.ts) находится офлайн-логика: если
        // оставить "online", весь offline-first слой ниже никогда не
        // сработает. "always" вызывает mutationFn всегда, а решение
        // "идти в сеть или писать локально" принимает уже сам вызов внутри
        // api/*.ts (see isOffline()).
        networkMode: "always",
        retry: false,
      },
    },
  });
}

const browserQueryClient = makeQueryClient();

export function getQueryClient() {
  return browserQueryClient;
}

const PERSIST_KEY = "trade-crm-query-cache";

/**
 * Персистер, сохраняющий кэш React Query в localStorage. Работает и в
 * обычном браузере, и в Capacitor WebView (localStorage там тоже доступен),
 * поэтому список товаров/должников/транзакций остаётся видимым и без сети.
 */
export function getQueryPersister() {
  return createSyncStoragePersister({
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    key: PERSIST_KEY,
    throttleTime: 1000,
  });
}

export const QUERY_PERSIST_MAX_AGE = OFFLINE_CACHE_MS;
