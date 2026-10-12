import type { QueryClient } from '@tanstack/react-query';
import i18next from 'i18next';
import { toast } from 'sonner';
import { create } from 'zustand';
import { getIsOnline } from '~/lib/network-status';
import { readLastSync, runSync, type LastSync, type SyncOutcome, type SyncSnapshot } from '~/lib/offline-sync';

/**
 * Состояние «синхронизировать всё» — глобальное, а не на странице: запуск идёт,
 * пока человек переходит по приложению, а кнопка в шапке и страница /sync
 * показывают один и тот же прогресс.
 */
interface SyncState {
  running: boolean;
  snapshot: SyncSnapshot | null;
  /** Чем закончился последний запуск в этой сессии (для подсказки на странице). */
  outcome: SyncOutcome | null;
  /** Последний завершённый запуск — переживает перезапуск приложения. */
  lastSync: LastSync | null;
  start: (queryClient: QueryClient) => Promise<void>;
  cancel: () => void;
  loadLastSync: () => Promise<void>;
  /** Забыть всё о прошлых запусках — после выхода из аккаунта / очистки кеша. */
  reset: () => void;
}

let controller: AbortController | null = null;

const t = (key: string) => i18next.t(key, { ns: 'sync' });

export const useSyncStore = create<SyncState>((set, get) => ({
  running: false,
  snapshot: null,
  outcome: null,
  lastSync: null,

  async start(queryClient) {
    if (get().running) return;
    if (!getIsOnline()) {
      toast.error(t('toast.offline'));
      return;
    }

    controller = new AbortController();
    set({ running: true, snapshot: null, outcome: null });

    let outcome: SyncOutcome;
    try {
      outcome = await runSync({
        queryClient,
        signal: controller.signal,
        onProgress: (snapshot) => set({ snapshot }),
      });
    } catch {
      // Непредвиденный сбой — не оставляем кнопку «вечно крутящейся».
      outcome = 'partial';
    }

    controller = null;
    set({ running: false, outcome, lastSync: (await readLastSync()) ?? get().lastSync });

    if (outcome === 'complete') toast.success(t('toast.complete'));
    else if (outcome === 'partial') toast.warning(t('toast.partial'));
    else if (outcome === 'throttled') toast.warning(t('toast.throttled'));
    else if (outcome === 'cancelled') toast(t('toast.cancelled'));
    // 'unauthorized': перехватчик axios уже увёл на экран входа.
  },

  cancel() {
    controller?.abort();
  },

  async loadLastSync() {
    const lastSync = await readLastSync();
    set({ lastSync });
  },

  reset() {
    controller?.abort();
    set({ running: false, snapshot: null, outcome: null, lastSync: null });
  },
}));

/** Общий прогресс 0–100; null, пока объём работы ещё выясняется. */
export function syncPercent(snapshot: SyncSnapshot | null): number | null {
  if (!snapshot || snapshot.phase !== 'running' || snapshot.total === 0) return null;
  return Math.min(100, Math.round((snapshot.done / snapshot.total) * 100));
}
