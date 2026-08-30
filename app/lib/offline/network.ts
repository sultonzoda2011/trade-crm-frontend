// app/lib/offline/network.ts
//
// Единственный источник правды о том, «есть ли сейчас связь с сервером».
// До этого модуля офлайн определялся по navigator.onLine в каждом api/*.ts,
// а это флаг ПОДКЛЮЧЕНИЯ, а не доступности сервера: Wi-Fi без интернета,
// captive portal в кафе, лежащий бэкенд, таймаут — везде onLine === true,
// офлайн-ветка не срабатывала и операция терялась.
//
// Поэтому здесь два уровня:
//   1) состояние ОС/устройства — @capacitor/network (надёжнее в WebView),
//      с фолбэком на navigator.onLine для обычного веба;
//   2) «мягкий офлайн» (markUnreachable) — любой запрос, упавший без ответа
//      сервера, на UNREACHABLE_TTL_MS переводит приложение в офлайн-режим,
//      чтобы следующие вызовы сразу шли в локальную ветку, а не ждали
//      таймаута по очереди.

/** Сколько держим «мягкий офлайн» после неудачного запроса. */
const UNREACHABLE_TTL_MS = 20_000;

type NetworkListener = (online: boolean) => void;

/** Значение от @capacitor/network; null — плагин недоступен (обычный веб). */
let deviceOnline: boolean | null = null;
/** Пока Date.now() < этого значения, считаем, что сервера нет. */
let unreachableUntil = 0;
let recheckTimer: ReturnType<typeof setTimeout> | null = null;
let watching = false;
let lastNotified: boolean | null = null;

const listeners = new Set<NetworkListener>();

function deviceHasNetwork(): boolean {
  if (deviceOnline !== null) return deviceOnline;
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/** Есть ли связь: и сеть на устройстве, и сервер отвечал в последнее время. */
export function isOnline(): boolean {
  return deviceHasNetwork() && Date.now() >= unreachableUntil;
}

export function isOffline(): boolean {
  return !isOnline();
}

function notify(): void {
  const value = isOnline();
  if (value === lastNotified) return;
  lastNotified = value;
  listeners.forEach((listener) => listener(value));
}

/**
 * Запрос упал, не получив ответа сервера → уходим в «мягкий офлайн».
 * Вызывается из response-интерцептора (~/lib/client.ts), поэтому покрывает
 * вообще все запросы приложения, а не только обёрнутые в withOffline().
 */
export function markUnreachable(): void {
  unreachableUntil = Date.now() + UNREACHABLE_TTL_MS;
  if (recheckTimer) clearTimeout(recheckTimer);
  // Сам TTL никакого события не генерирует — будим слушателей руками,
  // иначе бейдж в хедере остался бы «офлайн» до следующего запроса.
  recheckTimer = setTimeout(() => {
    recheckTimer = null;
    notify();
  }, UNREACHABLE_TTL_MS + 100);
  notify();
}

/** Сервер ответил — снимаем «мягкий офлайн» досрочно. */
export function markReachable(): void {
  if (unreachableUntil === 0) return;
  unreachableUntil = 0;
  if (recheckTimer) {
    clearTimeout(recheckTimer);
    recheckTimer = null;
  }
  notify();
}

/**
 * Ошибка означает «до сервера не дошли», а не «сервер отказал».
 * Важно: RBAC-отказ из request-интерцептора — обычный Error без isAxiosError,
 * и сетевой ошибкой считаться не должен, иначе запрещённое действие ушло бы
 * в офлайн-очередь и реплеилось вечно.
 */
export function isNetworkError(error: unknown): boolean {
  const candidate = error as { response?: unknown; isAxiosError?: boolean; code?: string } | null;
  if (!candidate || typeof candidate !== 'object') return false;
  if (candidate.response) return false;
  if (!candidate.isAxiosError) return false;
  return candidate.code !== 'ERR_CANCELED';
}

export function subscribeNetwork(listener: NetworkListener): () => void {
  ensureNetworkWatcher();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Идемпотентно навешивает слушатели сети (модуль-синглтон на всё приложение). */
export function ensureNetworkWatcher(): void {
  if (watching || typeof window === 'undefined') return;
  watching = true;
  lastNotified = isOnline();

  window.addEventListener('online', () => {
    // Сеть сменилась — даём серверу новый шанс, не дожидаясь конца TTL.
    unreachableUntil = 0;
    notify();
  });
  window.addEventListener('offline', () => notify());

  void (async () => {
    try {
      const { Network } = await import('@capacitor/network');
      const status = await Network.getStatus();
      deviceOnline = status.connected;
      notify();
      await Network.addListener('networkStatusChange', (next) => {
        deviceOnline = next.connected;
        if (next.connected) unreachableUntil = 0;
        notify();
      });
    } catch {
      // Плагин не установлен/не засинкан (обычный веб) — window-событий достаточно.
    }
  })();
}
