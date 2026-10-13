import { useCacheCoverage } from '~/hooks/useCacheCoverage';
import { FRESH_WINDOW_MS } from '~/lib/offline-sync';

/**
 * Все сущности, доступные роли, загружены недавно (в пределах `FRESH_WINDOW_MS`)
 * и в полном объёме — «Синхронизировать всё» качать нечего. Используется, чтобы
 * отключать кнопку синхронизации и в шапке (`SyncStatus`), и на `/sync` (`SyncHero`).
 */
export function useAllUpToDate(): boolean {
  const coverage = useCacheCoverage();
  if (coverage.length === 0) return false;
  const now = Date.now();
  return coverage.every(
    (item) =>
      item.target !== null &&
      item.details >= item.target &&
      item.updatedAt !== null &&
      now - item.updatedAt < FRESH_WINDOW_MS
  );
}
