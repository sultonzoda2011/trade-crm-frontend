// app/lib/network-status.ts
import { onlineManager } from '@tanstack/react-query';

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
