import { MutationCache, QueryClient, keepPreviousData } from "@tanstack/react-query";
import { OFFLINE_QUEUE_SCOPE, registerOfflineMutationDefaults } from "~/lib/offline-mutations";
import { subscribeToNetworkStatus } from "~/lib/network-status";

// 400 дней — персистентный кеш (см. query-persister.ts) должен переживать
// даже очень долгий офлайн (по задаче — "запрос год назад, но показать
// кеш"), поэтому gcTime должен быть больше maxAge дехидрации, иначе
// react-query выкинет query из памяти раньше, чем успеет его сохранить.
export const PERSISTED_GC_TIME = 1000 * 60 * 60 * 24 * 400;

/** Сколько отправленная операция ещё лежит в MutationCache — чтобы экран, который её ждал, успел получить результат. */
const SENT_OPERATION_LINGER_MS = 4000;

export function makeQueryClient() {
  // У очереди gcTime = Infinity (упавшая операция ждёт решения человека), поэтому
  // успешно отправленные убираем сами — иначе они копились бы в памяти до перезапуска.
  const mutationCache = new MutationCache({
    onSuccess: (_data, _variables, _context, mutation) => {
      if (mutation.options.scope?.id !== OFFLINE_QUEUE_SCOPE.id) return;
      setTimeout(() => mutationCache.remove(mutation), SENT_OPERATION_LINGER_MS);
    },
  });

  const client = new QueryClient({
    mutationCache,
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

  // Отложенные create/pay/refund транзакций (см. offline-mutations.ts) —
  // их mutationFn не переживает сериализацию, поэтому должна быть
  // переустановлена на каждом новом QueryClient, а не только у того
  // useMutation(), который изначально поставил мутацию в очередь.
  registerOfflineMutationDefaults(client);

  // Единственное место, где очередь реально "будится": сеть вернулась —
  // пробуем отправить всё, что скопилось, пока её не было. Безопасно звать
  // и когда резюмировать нечего (no-op), и повторно при каждом следующем
  // восстановлении связи.
  subscribeToNetworkStatus((online) => {
    if (online) void client.resumePausedMutations();
  });

  return client;
}

const browserQueryClient = makeQueryClient();

export function getQueryClient() {
  return browserQueryClient;
}
