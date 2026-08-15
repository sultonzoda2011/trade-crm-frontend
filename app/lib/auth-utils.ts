import { Role } from '~/types/common';

/**
 * Приложение работает в SPA-режиме (`ssr: false`), поэтому здесь НЕТ функций,
 * читающих cookie из `Request.headers` — на клиенте такой заголовок недоступен.
 * Единственный источник личности на клиенте — не-httpOnly cookie `user`,
 * который выставляет бэкенд при login/refresh.
 *
 * `accessToken` и `refreshToken` httpOnly и из JS не читаются: срок жизни
 * токена не проверяется заранее — при 401 интерцептор в `~/lib/client.ts`
 * сам вызывает `tryRefreshToken()` и повторяет запрос.
 */

export interface UserInfo {
	role: Role;
	marketId: string;
	id: string;
	name: string;
	email: string;
	image: string | null;
}

/** Имя cookie для данных пользователя (не httpOnly — доступен в JS для RBAC) */
const USER_COOKIE = 'user';

/** Читает user info из не-httpOnly cookie (для клиентского JS) */
export const getUserFromCookie = (): UserInfo | null => {
	try {
		const cookies = document.cookie.split('; ').reduce((acc, c) => {
			const [k, v] = c.split('=');
			acc[k] = decodeURIComponent(v);
			return acc;
		}, {} as Record<string, string>);
		const userStr = cookies[USER_COOKIE];
		if (!userStr) return null;
		return JSON.parse(userStr);
	} catch {
		return null;
	}
};

/** Сохраняет user info в не-httpOnly cookie (для RBAC на клиенте) */
export const setUserCookie = (user: UserInfo): void => {
	const isProduction = window.location.protocol === 'https:';
	document.cookie = `${USER_COOKIE}=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${30 * 24 * 60 * 60}; ${isProduction ? 'secure; samesite=strict' : 'samesite=lax'}`;
};

/** Удаляет user cookie */
export const removeUserCookie = (): void => {
	const isProduction = window.location.protocol === 'https:';
	document.cookie = `${USER_COOKIE}=; path=/; max-age=0; ${isProduction ? 'secure; samesite=strict' : 'samesite=lax'}`;
};

const VALID_ROLES: Role[] = [Role.Admin, Role.Owner, Role.Seller];

/**
 * Клиентская версия для проверки авторизации (используется в хуках/компонентах).
 * Читает user info из не-httpOnly cookie.
 */
export function getClientUser(): UserInfo | null {
	const user = getUserFromCookie();
	if (!user || !VALID_ROLES.includes(user.role)) {
		return null;
	}
	return user;
}
