import { create } from 'zustand';
import { getQueryClient } from '~/lib/query-client';
import { listQueue, removeQueueItem, type QueuedMutation } from '~/lib/offline/queue';
import { runSync } from '~/lib/offline/syncService';

interface SyncState {
  pendingCount: number;
  lastSyncAt: string | null;
  isSyncing: boolean;
  outbox: QueuedMutation[];
  lastError: string | null;
  refreshOutbox: () => Promise<void>;
  runPush: () => Promise<void>;
  /** Только для элементов, уже помеченных 'failed' (превышены попытки) — убрать вручную. */
  cancelItem: (item: QueuedMutation) => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  pendingCount: 0,
  lastSyncAt: null,
  isSyncing: false,
  outbox: [],
  lastError: null,

  refreshOutbox: async () => {
    const items = await listQueue();
    set({ outbox: items, pendingCount: items.filter((i) => i.status !== 'failed').length });
  },

  runPush: async () => {
    if (get().isSyncing) return;
    set({ isSyncing: true, lastError: null });
    try {
      await runSync(getQueryClient());
      set({ lastSyncAt: new Date().toISOString() });
    } catch (err: any) {
      set({ lastError: err?.message ?? 'Sync failed' });
    } finally {
      set({ isSyncing: false });
      await get().refreshOutbox();
    }
  },

  cancelItem: async (item) => {
    // Мы никогда не делаем локальных оптимистичных пересчётов (остатки,
    // баланс) — поэтому отмена это просто удаление из очереди, без отката.
    await removeQueueItem(item.id);
    await get().refreshOutbox();
  },
}));
