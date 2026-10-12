import { useCallback, useEffect, useState } from 'react';
import { offlineStorage, type StorageStats } from '~/lib/offline-storage';

/** Сколько места занимает офлайн-кеш. `refreshOn` — любое значение, смена которого перечитывает размер. */
export function useStorageStats(refreshOn?: unknown) {
  const [stats, setStats] = useState<StorageStats | null>(null);

  const refresh = useCallback(async () => {
    setStats(await offlineStorage.stats());
  }, []);

  useEffect(() => {
    let alive = true;
    void offlineStorage.stats().then((next) => alive && setStats(next));
    return () => {
      alive = false;
    };
  }, [refreshOn]);

  return { stats, refresh };
}
