import { useEffect } from 'react';
import { setIsOnline } from '~/lib/network-status';

/**
 * Единственный источник правды о состоянии сети в приложении (см.
 * app/lib/network-status.ts). Capacitor Network надёжнее navigator.onLine +
 * window online/offline в Android WebView (тот нередко остаётся "online" без
 * реального подключения) и имеет полноценную веб-реализацию, так что отдельный
 * браузерный fallback не нужен — тот же код работает и в обычной вкладке.
 *
 * Паттерн — как в useCapacitorBackButton/useCapacitorStatusBar: динамический
 * import, чтобы не тянуть нативный мост туда, где он не нужен.
 */
export function useCapacitorNetworkStatus() {
  useEffect(() => {
    let removeListener: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      let Network: typeof import('@capacitor/network').Network;
      try {
        ({ Network } = await import('@capacitor/network'));
      } catch {
        return; // плагин недоступен — остаёмся на дефолтном "online"
      }
      if (cancelled) return;

      try {
        const status = await Network.getStatus();
        if (!cancelled) setIsOnline(status.connected);
      } catch {
        // не получилось узнать стартовый статус — дождёмся события
      }

      const handle = await Network.addListener('networkStatusChange', (status) => {
        setIsOnline(status.connected);
      });

      if (cancelled) {
        void handle.remove();
        return;
      }
      removeListener = () => void handle.remove();
    })();

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, []);
}
