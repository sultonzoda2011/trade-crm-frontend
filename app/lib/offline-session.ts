import type { QueryClient } from '@tanstack/react-query';
import { queryPersister } from '~/lib/query-persister';
import { useSyncStore } from '~/store/useSyncStore';

/**
 * Чей офлайн-кеш лежит на устройстве.
 *
 * Кеш и очередь хранят данные бизнеса (транзакции, должники, суммы) — они
 * принадлежат тому, кто вошёл. Если на телефоне сменился пользователь, его
 * предшественник не должен ни видеть эти данные, ни — что хуже — отправить свои
 * неотправленные продажи уже под чужой учётной записью. Поэтому:
 *   • явный выход из аккаунта стирает кеш и очередь (UserNav);
 *   • вход под другим пользователем стирает их тоже (ensureCacheOwner);
 *   • истёкшая сессия (401) не трогает ничего: тот же человек войдёт снова
 *     и очередь продолжит отправку.
 */

const OWNER_KEY = 'tradecrm-cache-owner';

function readOwner(): string | null {
  try {
    return window.localStorage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
}

function writeOwner(userId: string | null) {
  try {
    if (userId) window.localStorage.setItem(OWNER_KEY, userId);
    else window.localStorage.removeItem(OWNER_KEY);
  } catch {
    /* приватный режим — владелец просто не запомнится */
  }
}

/** Стереть всё офлайн-хранилище: кеш чтения, очередь операций, отметку последней синхронизации. */
export async function wipeOfflineData(queryClient: QueryClient): Promise<void> {
  useSyncStore.getState().reset();
  queryClient.clear();
  await queryPersister.removeClient();
  writeOwner(null);
}

/**
 * Вызывается при входе в CRM (layout loader). Если кеш принадлежал другому
 * пользователю — стирает его; иначе просто закрепляет владельца.
 *
 * Устройство, обновившееся с версии без учёта владельца, владельца ещё не знает —
 * считаем, что кеш принадлежит текущему пользователю (на устройстве он был один).
 */
export async function ensureCacheOwner(queryClient: QueryClient, userId: string): Promise<void> {
  const owner = readOwner();
  if (owner && owner !== userId) await wipeOfflineData(queryClient);
  writeOwner(userId);
}
