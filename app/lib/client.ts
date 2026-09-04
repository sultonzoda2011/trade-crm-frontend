// app/lib/client.ts
import axios from 'axios';
import i18next from 'i18next';
import { toast } from 'sonner';
import { Action, ACTION_PERMISSIONS } from '~/config/actions';
import { clearSession, getAccessToken, getClientUser } from '~/lib/auth-utils';
import { redirectToLogin } from '~/lib/navigation';
import { getIsOnline } from '~/lib/offline/network';
import { readFromCache, writeToCache } from '~/lib/offline/readCache';
import { enqueueMutation, type QueuedKind } from '~/lib/offline/queue';

// Единственные 3 мутации, которым разрешён офлайн-режим (см. решение по
// TradeCRM: остальные сущности офлайн только на чтение, без очереди).
// delete НИКОГДА сюда не попадает.
const OFFLINE_QUEUEABLE: { method: 'post' | 'patch'; pattern: RegExp; kind: QueuedKind }[] = [
  { method: 'post', pattern: /^\/transactions$/, kind: 'transaction:create' },
  { method: 'patch', pattern: /^\/transactions\/[^/]+\/pay$/, kind: 'transaction:pay' },
  { method: 'post', pattern: /^\/transactions\/[^/]+\/refund$/, kind: 'transaction:refund' },
];

function matchQueueable(urlPath: string, method: string) {
  return OFFLINE_QUEUEABLE.find((r) => r.method === method && r.pattern.test(urlPath));
}

const baseURL = (import.meta.env.VITE_API_URL || '') + '/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Some Android WebViews can hang indefinitely on a request that drops
  // mid-flight rather than failing fast, so cap it explicitly.
  timeout: 15000,
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

// ---------- request interceptor ----------
apiClient.interceptors.request.use(async (config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const urlPath = config.url || '';
  const method = (config.method || 'get') as Method;

  if (!isSilent(urlPath)) {
    const requiredAction = getApiAction(urlPath, method);
    if (requiredAction && !canAccessApi(requiredAction)) {
      toast.error(i18next.t('errors.forbidden', { ns: 'common' }));
      return Promise.reject(new Error(`Access denied: ${requiredAction}`));
    }
  }

  // Известно офлайн (не просто "запрос упал") — не ждём таймаут (15с) на
  // реальную попытку, сразу помечаем запрос для обработки в response-error
  // интерцепторе (GET -> кэш, разрешённые мутации -> очередь).
  if (!(await getIsOnline())) {
    return Promise.reject(Object.assign(new Error('offline'), { __offlineShortCircuit: true, config }));
  }

  // На Android WebView (и в целом в системном HTTP-стеке) GET-запрос может
  // быть тихо отдан из кэша самой сети/ОС, минуя сервер — axios при этом
  // получает нормальный успешный ответ и не может отличить его от реально
  // свежего. Наш собственный офлайн-кэш (readCache/writeToCache) это не
  // заменяет: он для случая "сети вообще нет", а не "сеть есть, но отдала
  // устаревшее". Поэтому явно запрещаем HTTP-кэширование заголовками.
  //
  // ВАЖНО: раньше здесь ещё добавлялся cache-buster прямо в URL
  // (`?_=timestamp`) — оказалось, что бэкенд слушает через глобальный
  // ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }), и этот
  // параметр долетал до @Query()-DTO эндпоинтов как лишнее поле, которое
  // валидация отклоняет 400-кой ("_ should not exist"). Заголовки в эту
  // валидацию не попадают (она смотрит только body/query/params), поэтому
  // используем только их — этого достаточно, штатный Cache-Control:no-store
  // соблюдается стандартным сетевым стеком WebView.
  if (method === 'get') {
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
  }

  return config;
});

// ---------- response interceptor ----------
apiClient.interceptors.response.use(
  async (response) => {
    // Успешный GET — освежаем офлайн-кэш этим ответом на будущее.
    if ((response.config.method || 'get') === 'get') {
      const urlPath = (response.config.url || '').split('?')[0];
      await writeToCache(urlPath, response.config.params, response.data).catch(() => undefined);
    }
    return response;
  },
  async (error) => {
    const status: number | undefined = error.response?.status;
    const config = error.config;
    const requestUrl: string | undefined = config?.url;
    const urlPath = (requestUrl || '').split('?')[0];
    const method = (config?.method || 'get') as Method;
    const isNetworkFailure = error.__offlineShortCircuit || !error.response;

    if (isSilent(requestUrl)) {
      return Promise.reject(error);
    }

    // Сеть недоступна (или запрос физически не дошёл) — для GET отдаём
    // кэш, для 3 разрешённых мутаций транзакций кладём в очередь и
    // возвращаем синтетический "успех", чтобы UI не отличал офлайн-кейс
    // от обычного (transactionsApi.create и т.п. просто получают data).
    if (isNetworkFailure) {
      if (method === 'get') {
        const cached = await readFromCache(urlPath, config?.params);
        if (cached !== null) {
          return { data: cached, status: 200, statusText: 'OK (cache)', headers: {}, config };
        }
      } else {
        const queueable = matchQueueable(urlPath, method);
        if (queueable) {
          const queued = await enqueueMutation({
            kind: queueable.kind,
            method: queueable.method,
            url: requestUrl!,
            payload: typeof config?.data === 'string' ? JSON.parse(config.data) : config?.data,
          });
          return {
            data: { offlineQueued: true, queueId: queued.id },
            status: 202,
            statusText: 'Accepted (queued offline)',
            headers: {},
            config,
          };
        }
      }
    }

    if (!error.response) {
      toast.error(i18next.t('errors.noConnection', { ns: 'common' }));
      return Promise.reject(error);
    }

    if (status === 401) {
      clearSession();
      redirectToLogin();
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
