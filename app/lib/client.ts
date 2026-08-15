// app/lib/client.ts
import axios from 'axios';
import i18next from 'i18next';
import { toast } from 'sonner';
import { Action, ACTION_PERMISSIONS } from '~/config/actions';
import { getClientUser, setUserCookie, type UserInfo } from '~/lib/auth-utils';
import { navigateTo } from '~/lib/navigation';

const baseURL = (import.meta.env.VITE_API_URL || '') + '/api';

export const apiClient = axios.create({
	baseURL,
	withCredentials: true,
	headers: {
		'Content-Type': 'application/json',
	},
});

const ERROR_MESSAGES: Record<number, string> = {
	400: 'errors.badRequest',
	403: 'errors.forbidden',
	404: 'errors.notFound',
	422: 'errors.validation',
	429: 'errors.tooManyRequests',
	500: 'errors.serverError',
	502: 'errors.badGateway',
	503: 'errors.serviceUnavailable',
};

const SILENT_URLS = ['/auth/login', '/auth/register', '/auth/logout'];

const isSilent = (url?: string): boolean => SILENT_URLS.some((silent) => url?.includes(silent));

type Method = 'get' | 'post' | 'patch' | 'put' | 'delete';

interface ApiRouteAction {
	pattern: string;
	methods: Method[];
	action: Action;
}

const API_ROUTE_ACTIONS: ApiRouteAction[] = [
	{ pattern: '/users', methods: ['get'], action: Action.USERS_VIEW },
	{ pattern: '/users', methods: ['post'], action: Action.USERS_CREATE },
	{ pattern: '/users/:id', methods: ['get'], action: Action.USERS_VIEW },
	{ pattern: '/users/:id', methods: ['patch'], action: Action.USERS_EDIT },
	{ pattern: '/users/:id', methods: ['delete'], action: Action.USERS_DELETE },
	{ pattern: '/markets', methods: ['get'], action: Action.MARKETS_VIEW },
	{ pattern: '/markets', methods: ['post'], action: Action.MARKETS_CREATE },
	{ pattern: '/markets/:id', methods: ['get'], action: Action.MARKETS_VIEW_BY_ID },
	{ pattern: '/markets/:id', methods: ['patch'], action: Action.MARKETS_EDIT },
	{ pattern: '/markets/:id', methods: ['delete'], action: Action.MARKETS_DELETE },
	{ pattern: '/products', methods: ['get'], action: Action.PRODUCTS_VIEW },
	{ pattern: '/products', methods: ['post'], action: Action.PRODUCTS_CREATE },
	{ pattern: '/products/:id', methods: ['get'], action: Action.PRODUCTS_VIEW },
	{ pattern: '/products/:id', methods: ['patch'], action: Action.PRODUCTS_EDIT },
	{ pattern: '/products/:id', methods: ['delete'], action: Action.PRODUCTS_DELETE },
	{ pattern: '/sellers', methods: ['get'], action: Action.SELLERS_VIEW },
	{ pattern: '/sellers', methods: ['post'], action: Action.SELLERS_CREATE },
	{ pattern: '/sellers/:id', methods: ['get'], action: Action.SELLERS_VIEW },
	{ pattern: '/sellers/:id', methods: ['patch'], action: Action.SELLERS_EDIT },
	{ pattern: '/sellers/:id', methods: ['delete'], action: Action.SELLERS_DELETE },
	{ pattern: '/debtors', methods: ['get'], action: Action.DEBTORS_VIEW },
	{ pattern: '/debtors', methods: ['post'], action: Action.DEBTORS_CREATE },
	{ pattern: '/debtors/:id', methods: ['get'], action: Action.DEBTORS_VIEW },
	{ pattern: '/debtors/:id', methods: ['patch'], action: Action.DEBTORS_EDIT },
	{ pattern: '/debtors/:id', methods: ['delete'], action: Action.DEBTORS_DELETE },
	{ pattern: '/transactions', methods: ['get'], action: Action.TRANSACTIONS_VIEW },
	{ pattern: '/transactions', methods: ['post'], action: Action.TRANSACTIONS_CREATE },
	{ pattern: '/transactions/:id', methods: ['get'], action: Action.TRANSACTIONS_VIEW },
	{ pattern: '/transactions/:id', methods: ['patch'], action: Action.TRANSACTIONS_EDIT },
	{ pattern: '/transactions/:id', methods: ['delete'], action: Action.TRANSACTIONS_DELETE },
	{ pattern: '/transactions/:id/pay', methods: ['patch'], action: Action.TRANSACTIONS_EDIT },
	{ pattern: '/transactions/:id/refund', methods: ['post'], action: Action.TRANSACTIONS_REFUND },
	{ pattern: '/categories', methods: ['get'], action: Action.CATEGORIES_MANAGE },
	{ pattern: '/categories', methods: ['post'], action: Action.CATEGORIES_MANAGE },
	{ pattern: '/categories/:id', methods: ['get'], action: Action.CATEGORIES_MANAGE },
	{ pattern: '/categories/:id', methods: ['patch'], action: Action.CATEGORIES_MANAGE },
	{ pattern: '/categories/:id', methods: ['delete'], action: Action.CATEGORIES_MANAGE },
];

function matchApiPath(urlPath: string, pattern: string): boolean {
	const urlParts = urlPath.split('/').filter(Boolean);
	const patternParts = pattern.split('/').filter(Boolean);
	if (urlParts.length !== patternParts.length) return false;
	return patternParts.every((part, i) => part.startsWith(':') || part === urlParts[i]);
}

function getApiAction(urlPath: string, method: Method): Action | null {
	const path = urlPath.split('?')[0];
	const matched = API_ROUTE_ACTIONS.find((r) => r.methods.includes(method) && matchApiPath(path, r.pattern));
	return matched?.action ?? null;
}

function canAccessApi(action: Action): boolean {
	const user = getClientUser();
	if (!user) return false;
	const allowedRoles = ACTION_PERMISSIONS[action];
	return allowedRoles?.includes(user.role) ?? false;
}

// ---------- refresh token queue ----------
let refreshPromise: Promise<boolean> | null = null;

/**
 * Пытается обновить accessToken через httpOnly refresh cookie.
 * Возвращает true при успехе, false если сессия истекла (fatal).
 * При сетевых/серверных ошибках возвращает false без редиректа.
 * accessToken теперь устанавливается бэкендом в httpOnly cookie — не трогаем js-cookie
 */
export async function tryRefreshToken(): Promise<boolean> {
	if (refreshPromise) {
		return refreshPromise;
	}

	refreshPromise = (async () => {
		try {
			// withCredentials: true отправляет httpOnly refresh cookie бэкенду.
			// Бэкенд ставит Set-Cookie user=... для localhost:4000, но document.cookie
			// на localhost:5173 видит тот же localhost — на практике в кросс-порт
			// разработке Set-Cookie из ответа может быть не применён немедленно.
			// Поэтому явно ставим user cookie из тела ответа сами.
			const { data } = await axios.post<{ accessToken: string; user: Omit<UserInfo, 'image'> }>(
				`${baseURL}/auth/refresh`, {}, { withCredentials: true }
			);
			if (data?.user) {
				setUserCookie({ ...data.user, image: null });
			}
			return true;
		} catch (err) {
			if (axios.isAxiosError(err) && err.response?.status === 401) {
				return false;
			}
			return false;
		}
	})();

	try {
		return await refreshPromise;
	} finally {
		refreshPromise = null;
	}
}

// ---------- request interceptor ----------
apiClient.interceptors.request.use((config) => {
	// accessToken теперь в httpOnly cookie — отправляется автоматически с withCredentials: true
	// Не добавляем Authorization 헤더 вручную

	const urlPath = config.url || '';
	const method = (config.method || 'get') as Method;

	if (!isSilent(urlPath)) {
		const requiredAction = getApiAction(urlPath, method);
		if (requiredAction && !canAccessApi(requiredAction)) {
			toast.error(i18next.t('errors.forbidden', { ns: 'common' }));
			return Promise.reject(new Error(`Access denied: ${requiredAction}`));
		}
	}

	return config;
});

// ---------- response interceptor ----------
apiClient.interceptors.response.use(
	(response) => response,
	async (error) => {
		const status: number | undefined = error.response?.status;
		const requestUrl: string | undefined = error.config?.url;

		if (status === 401 && !requestUrl?.includes('/auth/login')) {
			const refreshed = await tryRefreshToken();
			if (refreshed) {
				// accessToken теперь в httpOnly cookie — не читаем из js-cookie
				return apiClient(error.config);
			}

			// Refresh вернул 401 — сессия истекла
			navigateTo('/login');
			return Promise.reject(error);
		}

		if (isSilent(requestUrl)) {
			return Promise.reject(error);
		}

		if (!error.response) {
			toast.error(i18next.t('errors.noConnection', { ns: 'common' }));
			return Promise.reject(error);
		}

		const serverMessageRaw: string | string[] | undefined = error.response.data?.message || error.response.data?.error;
		const serverMessage = Array.isArray(serverMessageRaw) ? serverMessageRaw.join(', ') : serverMessageRaw;

		const translationKey = ERROR_MESSAGES[status!];
		const translatedMessage = translationKey ? i18next.t(translationKey, { ns: 'common' }) : undefined;

		const message = serverMessage || translatedMessage || i18next.t('errors.unknown', { ns: 'common', status });

		toast.error(message);

		return Promise.reject(error);
	}
);