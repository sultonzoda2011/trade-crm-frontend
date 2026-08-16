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
  useNavigation,
  useNavigate,
} from 'react-router';

import type { Route } from '.react-router/types/app/+types/root';
import { QueryClientProvider } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'sonner';
import { ThemeProvider } from '~/components/theme-provider';
import ErrorPage from '~/components/shared/ErrorPage';
import { TooltipProvider } from '~/components/ui/tooltip';
import { fallbackLng, i18nConfig, supportedLngs } from '~/lib/i18n';
import { getQueryClient } from '~/lib/query-client';
import { setNavigate } from '~/lib/navigation';
import { useIsMobile } from '~/hooks/use-mobile';
import { useCapacitorBackButton } from '~/hooks/useCapacitorBackButton';
import { useCapacitorStatusBar } from '~/hooks/useCapacitorStatusBar';
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
        <title>Trade CRM</title>
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

const splashHints: Record<string, string> = {
  ru: 'Подготовка рабочего стола…',
  en: 'Preparing workspace…',
  tg: 'Омода кардани муҳити кор…',
};

function Splash({ locale }: { locale: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.state !== 'idle') return;
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    const t = setTimeout(() => setGone(true), 300);
    return () => clearTimeout(t);
  }, [navigation.state]);

  if (gone) return null;

  return (
    <div ref={ref} id="app-splash">
      <div className="splash-content">
        <div className="splash-logo">
          <img
            className="h-24 w-auto object-contain dark:hidden"
            src="/text-in-bottom-logo-light.png"
            alt="Trade CRM"
          />
          <img
            className="hidden h-24 w-auto object-contain dark:block"
            src="/text-in-bottom-logo-dark.png"
            alt="Trade CRM"
          />
        </div>
        <div className="splash-loader" />
        <p className="splash-hint">{splashHints[locale] ?? splashHints.ru}</p>
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
  const isMobile = useIsMobile();
  return (
    <Toaster
      theme={resolvedTheme as 'light' | 'dark'}
      gap={8}
      visibleToasts={5}
      closeButton
      position={isMobile ? 'top-center' : 'bottom-right'}
    />
  );
}

function CapacitorBridge() {
  const { resolvedTheme } = useTheme();
  useCapacitorBackButton();
  useCapacitorStatusBar(resolvedTheme);
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