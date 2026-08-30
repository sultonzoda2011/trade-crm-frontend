// app/lib/offline/networkStatus.ts
//
// Единый источник правды "онлайн мы или нет". НЕ полагается только на
// navigator.onLine — в Android WebView (Capacitor) это свойство печально
// известно тем, что либо не обновляется при реальном отключении сети, либо
// всегда возвращает true. Источник истины — @capacitor/network (спрашивает
// у ОС), с window online/offline как фолбэком для обычного браузера
// (npm run dev), где Capacitor-плагина нет.
//
// getIsOnline() синхронный и читает закешированное значение — используется
// в axios request-интерцепторе (client.ts), где нельзя ждать async-проверку
// на каждый запрос. Значение обновляется в фоне подписками ниже.

let cachedOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let initialized = false;

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function setOnline(value: boolean) {
  if (cachedOnline === value) return;
  cachedOnline = value;
  notify();
}

/** Текущий статус сети — синхронно, для мест вне React (axios, syncEngine). */
export function getIsOnline(): boolean {
  return cachedOnline;
}

/** Подписка для React (см. useOnlineStatus.ts — useSyncExternalStore). */
export function subscribeOnline(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Вызывать один раз при старте приложения (см. useSyncEngine.ts). Без
 * вызова getIsOnline() всё равно работает — просто на исходном значении
 * navigator.onLine, без Capacitor-уточнения и без live-обновлений.
 */
export function initNetworkStatus(): () => void {
  if (initialized) return () => {};
  initialized = true;

  const cleanups: Array<() => void> = [];

  const onWindowOnline = () => setOnline(true);
  const onWindowOffline = () => setOnline(false);
  if (typeof window !== 'undefined') {
    window.addEventListener('online', onWindowOnline);
    window.addEventListener('offline', onWindowOffline);
    cleanups.push(() => {
      window.removeEventListener('online', onWindowOnline);
      window.removeEventListener('offline', onWindowOffline);
    });
  }

  let cancelled = false;
  void (async () => {
    try {
      const { Network } = await import('@capacitor/network');
      const status = await Network.getStatus();
      if (cancelled) return;
      setOnline(status.connected);
      const handle = await Network.addListener('networkStatusChange', (s) => setOnline(s.connected));
      if (cancelled) {
        void handle.remove();
        return;
      }
      cleanups.push(() => void handle.remove());
    } catch {
      // @capacitor/network недоступен (обычный браузер) — оставляем
      // window-события выше как единственный источник.
    }
  })();

  return () => {
    cancelled = true;
    cleanups.forEach((fn) => fn());
    initialized = false;
  };
}
