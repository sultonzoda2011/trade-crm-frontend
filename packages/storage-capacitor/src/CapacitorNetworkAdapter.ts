import { Network } from '@capacitor/network';
import type { NetworkAdapter } from '@trade-crm/offline-core';

/**
 * Обёртка над @capacitor/network — читает НАТИВНЫЙ статус сети ОС, а не
 * navigator.onLine (который в Android WebView не всегда надёжен). Это
 * источник для UI (disable кнопок push/pull, бейдж) — реальный успех
 * запроса всё равно определяется самим HTTP-вызовом, см. apiClient.
 */
export class CapacitorNetworkAdapter implements NetworkAdapter {
  private online = true;

  private constructor() {}

  static async create(): Promise<CapacitorNetworkAdapter> {
    const adapter = new CapacitorNetworkAdapter();
    const status = await Network.getStatus();
    adapter.online = status.connected;
    return adapter;
  }

  isOnline(): boolean {
    return this.online;
  }

  onChange(cb: (online: boolean) => void): () => void {
    const listenerPromise = Network.addListener('networkStatusChange', (status) => {
      this.online = status.connected;
      cb(status.connected);
    });
    return () => {
      listenerPromise.then((l) => l.remove());
    };
  }
}
