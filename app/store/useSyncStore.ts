import { create } from 'zustand';
import {
  cancelDebtorOffline,
  cancelTransactionOffline,
  countPending,
  listOutbox,
  pull,
  push,
  removeFromOutbox,
  type OutboxItem,
  type PushResult,
} from '@trade-crm/offline-core';
import { getStorage } from '~/lib/offline/storage';
import { httpClient } from '~/lib/offline/httpClient';

interface SyncState {
  pendingCount: number;
  lastSyncAt: string | null;
  isSyncing: boolean;
  outbox: OutboxItem[];
  lastError: string | null;
  refreshPendingCount: () => Promise<void>;
  refreshOutbox: () => Promise<void>;
  runPull: () => Promise<void>;
  runPush: () => Promise<PushResult | null>;
  cancelItem: (item: OutboxItem) => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  pendingCount: 0,
  lastSyncAt: null,
  isSyncing: false,
  outbox: [],
  lastError: null,

  refreshPendingCount: async () => {
    const storage = await getStorage();
    const n = await countPending(storage);
    set({ pendingCount: n });
  },

  refreshOutbox: async () => {
    const storage = await getStorage();
    const items = await listOutbox(storage);
    set({ outbox: items, pendingCount: items.length });
  },

  runPull: async () => {
    if (get().isSyncing) return;
    set({ isSyncing: true, lastError: null });
    try {
      const storage = await getStorage();
      await pull(storage, httpClient);
      set({ lastSyncAt: new Date().toISOString() });
    } catch (err: any) {
      set({ lastError: err?.message ?? 'Pull failed' });
    } finally {
      set({ isSyncing: false });
    }
  },

  runPush: async () => {
    if (get().isSyncing) return null;
    set({ isSyncing: true, lastError: null });
    try {
      const storage = await getStorage();
      const result = await push(storage, httpClient);
      await get().refreshOutbox();
      if (result.errors.length > 0) {
        set({ lastError: result.errors.map((e) => e.message).join('; ') });
      }
      return result;
    } catch (err: any) {
      set({ lastError: err?.message ?? 'Push failed' });
      return null;
    } finally {
      set({ isSyncing: false });
    }
  },
  cancelItem: async (item: OutboxItem) => {
    const storage = await getStorage();
    if (item.entity === 'transactions' && item.method === 'post') {
      // Только create-транзакцию можно безопасно отменить с откатом остатка.
      // Отмена оплаты (method: 'patch') сюда не попадёт — see /sync page filter.
      await cancelTransactionOffline(storage, item.localId);
    } else if (item.entity === 'debtors' && item.method === 'post') {
      await cancelDebtorOffline(storage, item.localId);
    } else {
      // Остальное — просто убираем сам outbox-элемент, без отката (сущность
      // не резервирует ресурс типа остатка, откатывать нечего).
      await removeFromOutbox(storage, item.id);
    }
    await get().refreshOutbox();
  },
}));
