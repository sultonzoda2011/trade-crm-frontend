import { isNativePlatform } from './platform';

// На Android WebView браузерные online/offline события ненадёжны (не всегда
// стреляют при потере wifi без смены IP) — поэтому на native используем
// @capacitor/network, а на вебе/Electron остаёмся на navigator.onLine.

export async function getIsOnline(): Promise<boolean> {
  if (await isNativePlatform()) {
    const { Network } = await import('@capacitor/network');
    return (await Network.getStatus()).connected;
  }
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

/** Подписка на смену статуса сети. Возвращает функцию отписки. */
export function onNetworkChange(callback: (online: boolean) => void): () => void {
  let cancelled = false;
  let removeCapacitorListener: (() => void) | undefined;

  (async () => {
    if (await isNativePlatform()) {
      if (cancelled) return;
      const { Network } = await import('@capacitor/network');
      const handle = await Network.addListener('networkStatusChange', (status) => {
        callback(status.connected);
      });
      removeCapacitorListener = () => handle.remove();
    } else {
      const on = () => callback(true);
      const off = () => callback(false);
      window.addEventListener('online', on);
      window.addEventListener('offline', off);
      removeCapacitorListener = () => {
        window.removeEventListener('online', on);
        window.removeEventListener('offline', off);
      };
    }
  })();

  return () => {
    cancelled = true;
    removeCapacitorListener?.();
  };
}
