import * as React from 'react';
import { getIsOnline, initNetworkStatus, subscribeOnline } from '~/lib/offline/networkStatus';

/**
 * Статус сети для UI (SyncStatusBadge и т.п.). Источник — networkStatus.ts:
 * @capacitor/network в первую очередь (навигатор.onLine ненадёжен в Android
 * WebView), браузерные online/offline — фолбэк для обычной разработки.
 */
export function useOnlineStatus() {
  React.useEffect(() => initNetworkStatus(), []);
  return React.useSyncExternalStore(subscribeOnline, getIsOnline, () => true);
}

