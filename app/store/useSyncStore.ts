import { create } from 'zustand';

export type SyncPhase = 'idle' | 'syncing' | 'error';

export interface SyncStoreState {
  phase: SyncPhase;
  /** Сколько действий ещё ждут отправки на сервер (outbox). */
  pendingCount: number;
  /** ISO-время последней успешной синхронизации, null — синхронизации ещё не было. */
  lastSyncedAt: string | null;
  lastError: string | null;

  setPhase: (phase: SyncPhase) => void;
  setPendingCount: (count: number) => void;
  setLastSyncedAt: (iso: string) => void;
  setLastError: (message: string | null) => void;
}

export const useSyncStore = create<SyncStoreState>((set) => ({
  phase: 'idle',
  pendingCount: 0,
  lastSyncedAt: null,
  lastError: null,

  setPhase: (phase) => set({ phase }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
  setLastError: (lastError) => set({ lastError }),
}));
