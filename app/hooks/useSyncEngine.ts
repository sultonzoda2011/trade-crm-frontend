import { useEffect } from 'react';
import { initNetworkStatus, subscribeOnline } from '~/lib/offline/networkStatus';
import { initSyncState, runSync } from '~/lib/offline/syncEngine';

/** Как часто фоново подтягивать снапшот, пока приложение открыто и есть сеть. */
const SYNC_INTERVAL_MS = 3 * 60 * 1000;

/**
 * Триггеры синхронизации:
 *  1. Старт приложения (если уже онлайн — например, токен остался с
 *     прошлого запуска). Если токена ещё нет (первый логин), этот вызов
 *     получит 401 и завершится ошибкой — тогда его подхватит повторный
 *     вызов runSync() из onSuccess логина (routes/(auth)/login/route.tsx).
 *  2. Смена статуса сети — источник networkStatus.ts (@capacitor/network в
 *     первую очередь, надёжнее в Android WebView, чем navigator.onLine).
 *  3. Возврат приложения из фона (@capacitor/app appStateChange) — телефон
 *     мог поймать сеть, пока приложение было свёрнуто.
 *  4. Периодически (SYNC_INTERVAL_MS), пока приложение открыто и есть сеть —
 *     чтобы данные обновлялись сами по себе, без захода на конкретную
 *     страницу и без явного события смены сети (частый случай: приложение
 *     открыли онлайн и просто сидят в нём долго на одной странице).
 *
 * Ставить этот хук один раз, на верхнем уровне (см. root.tsx CapacitorBridge).
 */
export function useSyncEngine() {
  useEffect(() => {
    let cancelled = false;
    const cleanups: Array<() => void> = [];

    cleanups.push(initNetworkStatus());

    void initSyncState();
    void runSync();
    // Холодный старт: сразу после открытия приложения сеть/DNS в WebView
    // иногда ещё не готовы, и первый runSync() падает по таймауту, хотя
    // интернет фактически есть уже через пару секунд. Не ждём до следующего
    // события/интервала — быстро перепроверяем один раз.
    const warmupId = window.setTimeout(() => void runSync(), 8000);
    cleanups.push(() => window.clearTimeout(warmupId));

    const intervalId = window.setInterval(() => void runSync(), SYNC_INTERVAL_MS);
    cleanups.push(() => window.clearInterval(intervalId));

    // subscribeOnline зовёт колбэк при КАЖДОМ изменении статуса (в т.ч. на
    // false) — синк запускаем только когда стали онлайн; сам runSync() всё
    // равно не отправит ничего, если на самом деле не online.
    cleanups.push(
      subscribeOnline(() => {
        void runSync();
      })
    );

    void (async () => {
      try {
        const { App } = await import('@capacitor/app');
        if (cancelled) return;
        const handle = await App.addListener('appStateChange', (state) => {
          if (state.isActive) void runSync();
        });
        cleanups.push(() => void handle.remove());
      } catch {
        // не в Capacitor — ничего не делаем.
      }
    })();

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
    };
  }, []);
}

