// app/lib/client.ts
import axios from 'axios';
import i18next from 'i18next';
import { toast } from 'sonner';
import { Action, ACTION_PERMISSIONS } from '~/config/actions';
import { clearSession, getAccessToken, getClientUser } from '~/lib/auth-utils';
import { getIsOnline } from '~/lib/offline/networkStatus';
import { redirectToLogin } from '~/lib/navigation';

const baseURL = (import.meta.env.VITE_API_URL || '') + '/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Без этого запрос, оборвавшийся ПОСЛЕ отправки (сеть пропала не до, а
  // прямо во время ожидания ответа — гонка, которую request-интерцептор
  // ниже не ловит), может висеть неопределённо долго в некоторых Android
  // WebView. Из-за этого бейдж синка застревал на "Синхронизация..."
  // навсегда, а не показывал "Офлайн". 15с — с запасом даже для /sync/pull
  // с полным снапшотом на медленной связи.
  timeout: 15000,
});

/**
 * Брошено request-интерцептором, если запроса без сети не было и быть не
 * могло — устройство офлайн. Отличаем от обычной сетевой ошибки (реальная
 * попытка соединения оборвалась), чтобы не показывать тост "нет соединения"
 * на КАЖДЫЙ из десятков запросов, которые страница шлёт при заходе офлайн —
 * пользователь и так видит статус в SyncStatusBadge.
 */
export class OfflineError extends Error {
  url?: string;
  method?: string;
  constructor(url?: string, method?: string) {
    super(`Offline: request to "${url ?? ''}" was not sent`);
    this.name = 'OfflineError';
    this.url = url;
    this.method = method;
  }
}

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
apiClient.interceptors.request.use((config) => {
  // Главный фикс: без этой проверки каждый запрос реально уходил в сеть и
  // висел на таймауте (10-30 секунд) прежде чем упасть — и это на КАЖДОЙ
  // странице, а не только там, где явно обработан офлайн (transactions/
  // products/debtors/categories). Обрываем здесь, для ВСЕХ запросов сразу,
  // за миллисекунды, ещё до попытки открыть соединение.
  if (!getIsOnline()) {
    return Promise.reject(new OfflineError(config.url, config.method));
  }

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

  return config;
});

// ---------- response interceptor ----------
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Запрос даже не уходил (см. request-интерцептор выше) — это ожидаемо
    // при отсутствии сети, не полагающаяся на сервер ошибка. Молча
    // отклоняем: TanStack Query (retry: false без сети, offlineFirst)
    // покажет то, что есть в кэше, без спама тостами по каждой странице.
    if (error instanceof OfflineError) {
      if (isSilent(error.url)) {
        return Promise.reject(error);
      }
      const method = (error.method || 'get') as Method;
      if (method !== 'get') {
        // Запись (create/update/delete) в модуле, где ещё нет своей
        // офлайн-логики (см. handoff-план: markets/users/sellers/...) —
        // честно говорим, что действие не выполнено, а не проглатываем
        // молча (иначе выглядит так, будто кнопка "Сохранить" сломана).
        toast.error(i18next.t('errors.offlineAction', { ns: 'common' }));
      }
      // GET — тихо: страница остаётся с тем, что уже есть в персистентном
      // кэше React Query, без тоста на каждый заход/фильтр.
      return Promise.reject(error);
    }

    const status: number | undefined = error.response?.status;
    const requestUrl: string | undefined = error.config?.url;

    if (isSilent(requestUrl)) {
      return Promise.reject(error);
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
