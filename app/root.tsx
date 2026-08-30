import i18next from 'i18next';
import Cookies from 'js-cookie';
import NProgress from 'nprogress';
import { lazy, useEffect, useRef, useState } from 'react';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useNavigate,
  useNavigation,
} from 'react-router';

import type { Route } from '.react-router/types/app/+types/root';
import { QueryClientProvider } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'sonner';
import ErrorPage from '~/components/shared/ErrorPage';
import { ThemeProvider } from '~/components/theme-provider';
import { TooltipProvider } from '~/components/ui/tooltip';
import { useCapacitorBackButton } from '~/hooks/useCapacitorBackButton';
import { useCapacitorStatusBar } from '~/hooks/useCapacitorStatusBar';
import { getStorage } from '~/lib/offline/storage';
import { useSyncStore } from '~/store/useSyncStore';
import { Capacitor } from '@capacitor/core';
import { fallbackLng, i18nConfig, supportedLngs } from '~/lib/i18n';
import { setNavigate } from '~/lib/navigation';
import { getQueryClient } from '~/lib/query-client';
import './styles/global.css';
import './styles/nprogress.css';

export async function clientLoader() {
  const fromCookie = Cookies.get('lng');

  const locale =
    fromCookie && (supportedLngs as readonly string[]).includes(fromCookie)
      ? fromCookie
      : navigator.language.split('-')[0] || fallbackLng;

  return { locale };
}

export const handle = { i18n: i18nConfig.ns };

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap',
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const data = useLoaderData<typeof clientLoader>();
  const locale = data?.locale ?? 'ru';
  const navigate = useNavigate();

  useEffect(() => {
    if (i18next.isInitialized) {
      i18next.changeLanguage(locale);
    }
  }, [locale]);

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <title>TradeCRM</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <Meta />
        <Links />
      </head>
      <body>
        <Splash locale={locale} />
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <CapacitorBridge />
            <NavigationProgress />
            <TooltipProvider>{children}</TooltipProvider>
            <ToasterProvider />
          </ThemeProvider>
          {import.meta.env.DEV && <DevTools />}
        </QueryClientProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function Splash({ locale }: { locale: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [gone, setGone] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const navigation = useNavigation();

  const isLoadingDone = navigation.state === 'idle';

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(() => setVideoEnded(true));
    });
  }, []);

  // Страховка: если видео не загрузилось (404, неподдерживаемый кодек в
  // WebView, отсутствие сети) или зависло — не блокируем приложение
  // навсегда. onError закрывает случай явной ошибки, таймаут — случай
  // "тихого" зависания без события.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onError = () => setVideoEnded(true);
    v.addEventListener('error', onError);
    const timeout = setTimeout(() => setVideoEnded(true), 4000);
    return () => {
      v.removeEventListener('error', onError);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    // Прячем сплэш, только когда оба условия выполнены:
    // загрузка завершена И видео доиграло хотя бы один полный проход
    // (или сработал error/timeout-фолбэк выше)
    if (!isLoadingDone || !videoEnded) return;

    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    const t = setTimeout(() => setGone(true), 300);
    return () => clearTimeout(t);
  }, [isLoadingDone, videoEnded]);

  if (gone) return null;

  return (
    <div ref={ref} id="app-splash">
      <div className="splash-logo">
        <video
          ref={videoRef}
          className="m-auto w-full object-contain sm:w-[20%]"
          src="/logo-splash-animation.mp4"
          autoPlay
          playsInline
          onEnded={() => setVideoEnded(true)}
        />
      </div>
    </div>
  );
}

NProgress.configure({ showSpinner: false, trickleSpeed: 200 });

function NavigationProgress() {
  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.state === 'loading') {
      NProgress.start();
    } else {
      NProgress.done();
    }
  }, [navigation.state]);

  return null;
}

function ToasterProvider() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme as 'light' | 'dark'}
      gap={8}
      visibleToasts={5}
      closeButton
      position={'bottom-right'}
    />
  );
}

function CapacitorBridge() {
  const { resolvedTheme } = useTheme();
  useCapacitorBackButton();
  useCapacitorStatusBar(resolvedTheme);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    // Открываем/создаём локальную SQLite один раз при старте приложения,
    // не дожидаясь первого запроса какой-либо страницы — иначе первый
    // экран (обычно dashboard) увидит пустую базу на долю секунды.
    getStorage()
      .then(() => useSyncStore.getState().refreshPendingCount())
      .catch((err) => console.error('[offline] storage init failed', err));
  }, []);

  return null;
}

export default function App() {
  return <Outlet />;
}

const DevTools = lazy(() => import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools })));

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const { t } = useTranslation();
  let code = '500';
  let title = t('errors.unknown');
  let description = t('errors.unknown');
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    code = String(error.status);
    if (error.status === 404) {
      title = t('errors.notFound');
      description = '';
    } else {
      title = t('errors.unknown');
      description = error.statusText || description;
    }
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    description = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <ErrorPage
        code={code}
        icon="file"
        titleKey="errors.unknown"
        descriptionKey=""
        backHomeKey="pages.notFound.backHome"
        title={title}
        description={description}
      />
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
