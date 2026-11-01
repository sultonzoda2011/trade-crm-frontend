import { isAxiosError } from 'axios';

export interface ApiErrorInfo {
  status?: number;
  /** Машинный код бэкенда: `CURRENT_PASSWORD_INCORRECT`, `RESET_CODE_EXPIRED`… */
  code?: string;
  details?: unknown;
  /** Текст от сервера (англ.) — только для логов, пользователю показываем свой перевод. */
  message?: string;
  /** Запрос не ушёл: устройство офлайн (см. OfflineError в lib/client.ts). */
  isOffline: boolean;
  /** Ответа не было вообще (обрыв, таймаут). */
  isNetwork: boolean;
}

/**
 * Достаёт из ошибки запроса то, что нужно форме: статус, `code` и признак «нет
 * сети». Формы со `silent`-запросами сами решают, что и где показать.
 */
export function parseApiError(error: unknown): ApiErrorInfo {
  if ((error as { isOffline?: boolean } | null)?.isOffline) {
    return { isOffline: true, isNetwork: true };
  }
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { code?: unknown; details?: unknown; message?: string | string[] }
      | undefined;
    const message = Array.isArray(data?.message) ? data?.message.join(', ') : data?.message;
    return {
      status: error.response?.status,
      code: typeof data?.code === 'string' ? data.code : undefined,
      details: data?.details,
      message,
      isOffline: false,
      isNetwork: !error.response,
    };
  }
  return { isOffline: false, isNetwork: false };
}
