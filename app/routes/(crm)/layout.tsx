import { motion, AnimatePresence } from 'motion/react';
import { useRef } from 'react';
import { Outlet, redirect, useLocation } from 'react-router';
import { BottomNav } from '~/components/layout/BottomNav';
import { PageNote } from '~/components/layout/PageNote';
import Header from '~/components/layout/Header';
import { AppSidebar } from '~/components/layout/Sidebar';
import { SuccessDialog } from '~/components/shared/SuccessDialog';
import { ScrollArea } from '~/components/ui/scroll-area';
import { SidebarProvider } from '~/components/ui/sidebar';
import { canAccess } from '~/config/permissions';
import { PRIMARY_ORDER, PRIMARY_SLOTS, getSidebarConfig, getVisibleNavigation, type NavItem } from '~/config/navigation';
import { getClientUser } from '~/lib/auth-utils';
import { useCan } from '~/hooks/useCan';
import { useSwipeNav, type SwipeMode } from '~/hooks/useSwipeNav';
import { useTabNeighbors } from '~/hooks/useTabNeighbors';
import { useTranslation } from 'react-i18next';
import type { Route } from './+types/layout';

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  // В SPA-режиме request.headers не содержит токен — читаем клиентское
  // хранилище (localStorage) напрямую через getClientUser().
  const user = getClientUser();
  if (!user) {
    const url = new URL(request.url);
    const params = new URLSearchParams();
    params.set('redirectTo', url.pathname);
    return redirect(`/login?${params.toString()}`);
  }
  if (!canAccess(user.role, new URL(request.url).pathname)) {
    return redirect('/403');
  }
  return { user };
}

/**
 * Определяет режим свайп-навигации для текущего pathname:
 * - 'tabs'     — корневые страницы вкладок (/, /transactions, /debtors, ...)
 * - 'back'     — формы и детальные страницы (navigate(-1) свайпом вправо)
 * - 'disabled' — прочее
 *
 * «Корень таба» — это pathname, который точно совпадает с одним из URL
 * в nav-конфиге (не /transactions/123 и не /transactions/create).
 * Страницы из «Ещё» (не primary-слоты) получают 'back', а не 'tabs' —
 * свайп там работает только как «назад», не перелистывает вкладки.
 */
function resolveSwipeMode(pathname: string, primaryUrls: Set<string>): SwipeMode {
  // Dashboard — все /dashboard/* относятся к одной вкладке
  if (pathname.startsWith('/dashboard')) return 'tabs';

  // Точное совпадение с корнем primary-таба
  if (primaryUrls.has(pathname)) return 'tabs';

  // Формы и детальные страницы → свайп вправо = назад
  // Паттерн: заканчивается на /create, /edit или /uuid или /number
  if (/\/(create|edit)$/.test(pathname)) return 'back';
  if (/\/[^/]+$/.test(pathname) && !primaryUrls.has(pathname)) {
    // Любой подпуть — /debtors/123, /products/abc, /sellers/456/edit
    return 'back';
  }

  return 'disabled';
}

export default function CrmLayout() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { can, user } = useCan();

  // Вкладки дашборда — один экран: общий заголовок и фильтры не должны мигать
  // при переключении, поэтому для них ключ один и тот же.
  const routeKey = pathname.startsWith('/dashboard') ? '/dashboard' : pathname;

  // Вычисляем список primary-вкладок для определения режима и направления анимации
  const primaryUrls = useRef<Set<string>>(new Set());
  const navConfig = getSidebarConfig(t, user?.marketId);
  const visibleItems = getVisibleNavigation(navConfig, can);
  const byKey = new Map(visibleItems.map((item) => [item.key, item]));
  const primaryItems: NavItem[] = [];
  for (const navKey of PRIMARY_ORDER) {
    const item = byKey.get(navKey);
    if (item) primaryItems.push(item);
    if (primaryItems.length === PRIMARY_SLOTS) break;
  }
  primaryUrls.current = new Set(primaryItems.map((i) => i.url).filter(Boolean) as string[]);

  const swipeMode = resolveSwipeMode(pathname, primaryUrls.current);

  // Соседние URL для режима tabs
  const { prevUrl, nextUrl } = useTabNeighbors();

  // Определяем направление горизонтальной анимации
  const getTabIndex = (key: string) => {
    if (key.startsWith('/dashboard')) {
      return primaryItems.findIndex((i) => i.key === 'dashboard');
    }
    return primaryItems.findIndex((i) => i.url === key);
  };

  const prevRouteKeyRef = useRef<string>(routeKey);
  const prevIdx = getTabIndex(prevRouteKeyRef.current);
  const currIdx = getTabIndex(routeKey);
  const isTabTransition = prevIdx !== -1 && currIdx !== -1 && prevIdx !== currIdx;
  const direction = isTabTransition ? (currIdx > prevIdx ? 1 : -1) : 0;
  prevRouteKeyRef.current = routeKey;

  const { onTouchStart, onTouchEnd } = useSwipeNav({
    prevUrl,
    nextUrl,
    mode: swipeMode,
  });

  // Горизонтальная анимация для переходов между табами, вертикальная — для остального
  const xOffset = direction !== 0 ? `${direction * 40}%` : 0;
  const yOffset = direction === 0 ? 8 : 0;

  return (
    <SidebarProvider className="bg-background md:bg-sidebar h-dvh">
      <AppSidebar />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:m-2 md:rounded-2xl md:border md:shadow-sm">
        <Header />
        <ScrollArea className="bg-background min-h-0 flex-1">
          {/* pb на мобиле — место под плавающий BottomNav (сам бар + отступ от
              края + вылет центральной FAB-кнопки над баром). */}
          <div
            className="p-3 pb-[calc(6rem+env(safe-area-inset-bottom))] md:p-6"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}>
            {/* Горизонтальный слайд между соседними вкладками — как в нативных iOS/Android приложениях.
                Детальные страницы и формы — мягкое появление вертикально. */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={routeKey}
                initial={{ opacity: 0, x: xOffset, y: yOffset }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: direction !== 0 ? `${-direction * 20}%` : 0, y: direction === 0 ? -4 : 0 }}
                transition={{
                  duration: direction !== 0 ? 0.28 : 0.22,
                  ease: direction !== 0 ? [0.25, 0.46, 0.45, 0.94] : 'easeOut',
                }}>
                <Outlet />
                <PageNote />
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>
      <BottomNav />
      <SuccessDialog />
    </SidebarProvider>
  );
}
