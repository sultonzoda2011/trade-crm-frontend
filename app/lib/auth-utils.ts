import { Role } from '~/types/common';

/**
 * Аутентификация на Bearer-токене: бэкенд возвращает accessToken в теле
 * ответа `/auth/login`, клиент хранит его сам (cookie `accessToken`,
 * не-httpOnly — из JS его читает request interceptor) и отправляет дальше
 * в заголовке `Authorization: Bearer <token>`.
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
const TOKEN_MAX_AGE = 15 * 60; // 15 минут — совпадает с TTL токена
const USER_MAX_AGE = 30 * 24 * 60 * 60; // 30 дней

/** Флаги cookie: https → secure + strict, иначе только samesite=lax */
const cookieFlags = (maxAge: number): string => {
	const isProduction = typeof window !== 'undefined' && window.location.protocol === 'https:';
	return `path=/; max-age=${maxAge}; ${isProduction ? 'secure; samesite=strict' : 'samesite=lax'}`;
};

/** Читает значение cookie по имени */
const getCookie = (name: string): string | null => {
	if (typeof document === 'undefined') return null;
	const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
	if (!match) return null;
	try {
		return decodeURIComponent(match.slice(name.length + 1));
	} catch {
		return null;
	}
};

/** Удаляет cookie по имени */
const removeCookie = (name: string): void => {
	if (typeof document === 'undefined') return;
	document.cookie = `${name}=; path=/; max-age=0`;
};

/** Сохраняет access-токен (cookie) */
export const setAccessToken = (token: string): void => {
	if (typeof document === 'undefined') return;
	document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; ${cookieFlags(TOKEN_MAX_AGE)}`;
};

/** Читает access-токен */
export const getAccessToken = (): string | null => {
	return getCookie(TOKEN_KEY);
};

/** Удаляет access-токен */
export const removeAccessToken = (): void => {
	removeCookie(TOKEN_KEY);
};

/** Сохраняет user info (для RBAC на клиенте) */
export const setUserInfo = (user: UserInfo): void => {
	if (typeof document === 'undefined') return;
	document.cookie = `${USER_KEY}=${encodeURIComponent(JSON.stringify(user))}; ${cookieFlags(USER_MAX_AGE)}`;
};

/** Читает user info из cookie */
export const getUserInfo = (): UserInfo | null => {
	try {
		const raw = getCookie(USER_KEY);
		if (!raw) return null;
		return JSON.parse(raw);
	} catch {
		return null;
	}
};

/** Удаляет user info */
export const removeUserInfo = (): void => {
	removeCookie(USER_KEY);
};

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
