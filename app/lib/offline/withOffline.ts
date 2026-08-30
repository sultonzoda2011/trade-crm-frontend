// app/lib/offline/withOffline.ts
//
// Одно место, где принимается решение «идти в сеть или писать локально».
// Раньше каждый api/*.ts сам проверял navigator.onLine перед запросом —
// и если проверка проходила, а запрос всё равно падал (Wi-Fi без интернета,
// таймаут, лежащий сервер), операция терялась: локально не сохранилась,
// на сервер не уехала.
//
// Здесь логика такая:
//   офлайн по данным network.ts  → сразу локальная ветка;
//   иначе                        → пробуем сеть, и ТОЛЬКО при сетевой ошибке
//                                  (нет ответа сервера) уходим в локальную.
// Ошибку, на которую сервер ответил (400/403/409…), не глотаем: это
// осмысленный отказ, и пользователь должен его увидеть.
import { isNetworkError, isOffline, markReachable, markUnreachable } from '~/lib/offline/network';

let fallbackDepth = 0;

/**
 * true, пока выполняется запрос, у которого есть офлайн-фолбэк.
 * Нужно интерцептору в ~/lib/client.ts: сетевую ошибку такого запроса
 * не надо показывать тостом «нет соединения» — операция не провалилась,
 * она просто сохранится локально и уедет позже.
 */
export function isOfflineFallbackActive(): boolean {
  return fallbackDepth > 0;
}

export async function withOffline<T>(online: () => Promise<T>, offline: () => Promise<T>): Promise<T> {
  if (isOffline()) return offline();

  fallbackDepth++;
  try {
    const result = await online();
    markReachable();
    return result;
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    markUnreachable();
    return offline();
  } finally {
    fallbackDepth--;
  }
}
