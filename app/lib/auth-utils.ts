import { Role } from '~/types/common';

/**
 * Аутентификация на Bearer-токене: бэкенд возвращает accessToken в теле
 * ответа `/auth/login`. Клиент хранит его сам и отправляет дальше в заголовке
 * `Authorization: Bearer <token>` (см. request interceptor в lib/client.ts).
 * Никаких httpOnly-cookie и withCredentials — токен полностью клиентский.
 *
 * Хранилище — localStorage, НЕ cookie. Важно для Capacitor (Android APK):
 * cookie без max-age — это session-cookie, и WebView стирает их, как только
 * приложение закрыли/выгрузили из памяти. Из-за этого при следующем запуске
 * getClientUser() возвращал null и guard (crm)/layout.tsx кидал на /login.
 * localStorage в WebView персистентный и переживает перезапуск процесса,
 * поэтому сессия сохраняется между запусками приложения.
 */

export interface UserInfo {
  role: Role;
  marketId: string;
  id: string;
  name: string;
  email: string;
  image: string | null;
}

const TOKEN_KEY = 'accessToken';
const USER_KEY = 'user';

const hasWindow = (): boolean => typeof window !== 'undefined';

/** Читает старую session-cookie — нужно только для разовой миграции. */
const readLegacyCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return null;
  }
};

/** Удаляет старую cookie (чтобы не осталось двух источников правды). */
const clearLegacyCookie = (name: string): void => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0`;
};

/**
 * Читает значение из localStorage. Если его там нет, но осталась старая
 * cookie-сессия — переносит её в localStorage один раз и чистит cookie.
 */
const readStored = (key: string): string | null => {
  if (!hasWindow()) return null;
  try {
    const val = window.localStorage.getItem(key);
    if (val !== null) return val;

    const legacy = readLegacyCookie(key);
    if (legacy !== null) {
      window.localStorage.setItem(key, legacy);
      clearLegacyCookie(key);
      return legacy;
    }
    return null;
  } catch {
    return null;
  }
};

const writeStored = (key: string, value: string): void => {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* приватный режим / переполнение — молча игнорируем */
  }
};

const removeStored = (key: string): void => {
  if (!hasWindow()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* noop */
  }
  clearLegacyCookie(key);
};

/** Сохраняет access-токен */
export const setAccessToken = (token: string): void => writeStored(TOKEN_KEY, token);

/** Читает access-токен */
export const getAccessToken = (): string | null => readStored(TOKEN_KEY);

/** Удаляет access-токен */
export const removeAccessToken = (): void => removeStored(TOKEN_KEY);

/** Сохраняет user info (для RBAC на клиенте) */
export const setUserInfo = (user: UserInfo): void => writeStored(USER_KEY, JSON.stringify(user));

/** Читает user info из хранилища */
export const getUserInfo = (): UserInfo | null => {
  try {
    const raw = readStored(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserInfo;
  } catch {
    return null;
  }
};

/** Удаляет user info */
export const removeUserInfo = (): void => removeStored(USER_KEY);

/** Очищает всё, что относится к сессии (токен + user info) */
export const clearSession = (): void => {
  removeAccessToken();
  removeUserInfo();
};

const VALID_ROLES: Role[] = [Role.Admin, Role.Owner, Role.Seller];

/**
 * Клиентская версия для проверки авторизации (используется в хуках/компонентах).
 * Считается авторизованным, только если есть и токен, и валидный user info.
 */
export function getClientUser(): UserInfo | null {
  const token = getAccessToken();
  if (!token) return null;
  const user = getUserInfo();
  if (!user || !VALID_ROLES.includes(user.role)) {
    return null;
  }
  return user;
}
