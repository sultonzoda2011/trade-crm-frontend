/**
 * Разбор ошибок для офлайн-очереди и синхронизации.
 *
 * Зачем отдельный модуль: ошибка axios целиком — это AxiosError, и её `config`
 * содержит заголовок `Authorization: Bearer …`. Если такую ошибку записать в
 * персистентный кеш вместе с упавшей мутацией, токен окажется в SQLite. Поэтому
 * в хранилище попадает только `PlainError` — сообщение, статус и признак того,
 * стоит ли пробовать ещё раз.
 */

export interface PlainError {
  message: string;
  status?: number;
  code?: string;
  /** Временный сбой (сеть, таймаут, 5xx, 429…) — повтор имеет смысл. */
  transient: boolean;
}

interface ErrorLike {
  isOffline?: boolean;
  isAxiosError?: boolean;
  message?: string;
  code?: string;
  status?: number;
  transient?: boolean;
  response?: {
    status?: number;
    headers?: Record<string, unknown>;
    data?: { message?: string | string[]; error?: string } | null;
  };
}

const asErrorLike = (error: unknown): ErrorLike =>
  typeof error === 'object' && error !== null ? (error as ErrorLike) : {};

/** Запрос не ушёл, потому что устройство уже знает, что офлайн (см. OfflineError в client.ts). */
export function isOfflineError(error: unknown): boolean {
  return asErrorLike(error).isOffline === true;
}

export function getErrorStatus(error: unknown): number | undefined {
  const e = asErrorLike(error);
  return e.response?.status ?? e.status;
}

/** Сообщение, которое прислал сервер (валидация, «недостаточно товара» и т.п.). */
export function getServerMessage(error: unknown): string | undefined {
  const raw = asErrorLike(error).response?.data;
  const message = raw?.message ?? raw?.error;
  if (Array.isArray(message)) return message.join(', ') || undefined;
  return typeof message === 'string' && message ? message : undefined;
}

/** Сколько секунд сервер просит подождать (`Retry-After`) — для 429. */
export function getRetryAfterSeconds(error: unknown): number | undefined {
  const headers = asErrorLike(error).response?.headers;
  if (!headers) return undefined;
  const raw = headers['retry-after'] ?? headers['Retry-After'];
  const seconds = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
}

/**
 * Временный ли это сбой. Бизнес-ошибки (400/403/404/422) повторять бессмысленно —
 * ответ будет тот же. 409 считается временным: бэкенд отвечает им, когда запрос
 * с тем же `Idempotency-Key` ещё обрабатывается (типично после таймаута на
 * слабой сети), и повтор получит уже готовый ответ.
 */
export function isTransientError(error: unknown): boolean {
  const e = asErrorLike(error);
  if (e.transient !== undefined) return e.transient;
  if (isOfflineError(error)) return true;

  const status = getErrorStatus(error);
  if (status === undefined) {
    // Нет ответа сервера: сеть/таймаут у axios. Любая другая ошибка без статуса
    // (например, локальный отказ по правам) — не сетевая, повторять нечего.
    return e.isAxiosError === true;
  }
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

/** Безопасный для записи на диск вид ошибки. */
export function toPlainError(error: unknown): PlainError {
  const e = asErrorLike(error);
  return {
    message: getServerMessage(error) ?? e.message ?? 'Error',
    status: getErrorStatus(error),
    code: e.code,
    transient: isTransientError(error),
  };
}
