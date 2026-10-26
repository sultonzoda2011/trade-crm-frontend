// app/lib/network-status.ts
import { onlineManager } from '@tanstack/react-query';
import { useEffect } from 'react';

type Listener = (isOnline: boolean) => void;

const listeners = new Set<Listener>();

// До первого ответа Capacitor Network (см. useCapacitorNetworkStatus)
// считаем, что онлайн — это безопасный дефолт для первого рендера/веба.
let online = true;

export function getIsOnline(): boolean {
  return online;
}

export function setIsOnline(next: boolean): void {
  if (next === online) return;
  online = next;
  listeners.forEach((listener) => listener(online));
}

export function subscribeToNetworkStatus(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Подключаем react-query к тому же источнику состояния сети, что и весь
// остальной app (axios-interceptor в lib/client.ts, индикатор в шапке).
// Дефолтный onlineManager слушает window 'online'/'offline' + navigator.onLine,
// которые в Android WebView часто не обновляются вовремя — запросы продолжают
// улетать в сеть, таймаутятся и кеш фактически не используется.
onlineManager.setEventListener((setQueryClientOnline) => subscribeToNetworkStatus(setQueryClientOnline));

/**
 * Единственный источник правды о состоянии сети в приложении.
 * Capacitor Network надёжнее navigator.onLine + window online/offline в Android WebView
 * (тот нередко остаётся "online" без реального подключения) и имеет полноценную
 * веб-реализацию, так что отдельный браузерный fallback не нужен — тот же код
 * работает и в обычной вкладке.
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
