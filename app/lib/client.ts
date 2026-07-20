// app/lib/client.ts
import axios from 'axios';
import i18next from 'i18next';
import Cookies from 'js-cookie';
import { toast } from 'sonner';

const baseURL = (import.meta.env.VITE_API_URL || '') + '/api';

export const apiClient = axios.create({
  baseURL,
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

const SILENT_URLS = ['/auth/login', '/auth/register'];

const isSilent = (url?: string): boolean => SILENT_URLS.some((silent) => url?.includes(silent));

apiClient.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status: number | undefined = error.response?.status;
    const requestUrl: string | undefined = error.config?.url;

    if (status === 401) {
      Cookies.remove('token');
      // full page reload so QueryClient is re-created and cache is gone
      window.location.replace('/login');
      return Promise.reject(error);
    }

    if (isSilent(requestUrl)) {
      return Promise.reject(error);
    }

    if (!error.response) {
      toast.error(i18next.t('errors.noConnection', { ns: 'common' }));
      return Promise.reject(error);
    }

    const serverMessage: string | undefined = error.response.data?.message || error.response.data?.error;

    const translationKey = ERROR_MESSAGES[status!];
    const translatedMessage = translationKey ? i18next.t(translationKey, { ns: 'common' }) : undefined;

    const message = serverMessage || translatedMessage || i18next.t('errors.unknown', { ns: 'common', status });

    toast.error(message);

    return Promise.reject(error);
  }
);
