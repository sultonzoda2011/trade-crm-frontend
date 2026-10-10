import { useSyncExternalStore } from 'react';
import { getIsOnline, subscribeToNetworkStatus } from '~/lib/network-status';

/**
 * Текущее состояние сети для UI (например, индикатор в шапке). Инициализация
 * слушателя — в useCapacitorNetworkStatus (вызывается один раз в CapacitorBridge).
 */
export function useNetworkStatus(): boolean {
  return useSyncExternalStore(subscribeToNetworkStatus, getIsOnline, () => true);
}
