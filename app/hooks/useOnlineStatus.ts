import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { CapacitorNetworkAdapter } from '@trade-crm/storage-capacitor';
import type { NetworkAdapter } from '@trade-crm/offline-core';

/** Браузерный fallback, чтобы Header не падал при обычном `npm run dev`. */
class BrowserNetworkAdapter implements NetworkAdapter {
  isOnline(): boolean {
    return typeof navigator === 'undefined' ? true : navigator.onLine;
  }
  onChange(cb: (online: boolean) => void): () => void {
    const on = () => cb(true);
    const off = () => cb(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }
}

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const adapter: NetworkAdapter = Capacitor.isNativePlatform()
        ? await CapacitorNetworkAdapter.create()
        : new BrowserNetworkAdapter();
      if (cancelled) return;
      setOnline(adapter.isOnline());
      unsubscribe = adapter.onChange(setOnline);
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return online;
}
