// app/lib/offline/syncEngine.ts
//
// Двигатель синхронизации: orchestrate push + pull через store методы.
import { getIsOnline } from '~/lib/offline/networkStatus';
import { useSyncStore } from '~/store/useSyncStore';

let syncInFlight: Promise<void> | null = null;

/**
 * Запускает push+pull, если сеть есть. Безопасно вызывать многократно
 * подряд (network flapping, App resume + Network listener одновременно) —
 * параллельные вызовы схлопываются в один запущенный проход.
 *
 * push и pull выполняются отдельно: ошибка в push не может помешать pull.
 */
export async function runSync(): Promise<void> {
  if (!getIsOnline()) {
    console.info('[sync] skipped: offline (networkStatus)');
    return;
  }

  const store = useSyncStore.getState();
  if (store.isSyncing) {
    // Уже идёт синхронизация
    return syncInFlight ?? Promise.resolve();
  }

  syncInFlight = (async () => {
    try {
      // Push: отправляем outbox на сервер
      await store.runPush();
    } catch (error) {
      console.error('[sync] push crashed unexpectedly', error);
    }

    try {
      // Pull: получаем изменения с сервера
      await store.runPull();
    } catch (error) {
      console.error('[sync] pull crashed unexpectedly', error);
    }

    syncInFlight = null;
  })();

  return syncInFlight;
}

/** Вызывать один раз при старте приложения, чтобы бейдж сразу показал реальное число pending. */
export async function initSyncState(): Promise<void> {
  await useSyncStore.getState().refreshPendingCount();
}
