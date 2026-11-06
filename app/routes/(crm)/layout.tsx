import { motion } from 'motion/react';
import { Outlet, redirect, useLocation } from 'react-router';
import { BottomNav } from '~/components/layout/BottomNav';
import { PageNote } from '~/components/layout/PageNote';
import Header from '~/components/layout/Header';
import { AppSidebar } from '~/components/layout/Sidebar';
import { SuccessDialog } from '~/components/shared/SuccessDialog';
import { ScrollArea } from '~/components/ui/scroll-area';
import { SidebarProvider } from '~/components/ui/sidebar';
import { useIsMobile } from '~/hooks/use-mobile';
import { useHideNativeSplash } from '~/hooks/useHideNativeSplash';
import { useRouteDirection } from '~/hooks/useRouteDirection';
import { canAccess } from '~/config/permissions';
import { getClientUser } from '~/lib/auth-utils';
import { ensureCacheOwner } from '~/lib/offline-session';
import { getQueryClient } from '~/lib/query-client';
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
  // Кеш на устройстве принадлежит тому, кто вошёл: при смене пользователя он стирается
  // ещё до первого рендера, чтобы чужие данные и неотправленные операции не просочились.
  await ensureCacheOwner(getQueryClient(), user.id);
  return { user };
}

export default function CrmLayout() {
  const { pathname } = useLocation();
  // Вкладки дашборда — один экран: общий заголовок и фильтры не должны мигать
  // при переключении, поэтому для них ключ один и тот же.
  const routeKey = pathname.startsWith('/dashboard') ? '/dashboard' : pathname;
  const direction = useRouteDirection(routeKey);
  const isMobile = useIsMobile();
  // Экран готов — системный сплэш Android можно убирать.
  useHideNativeSplash();

  // На телефоне вглубь экран приезжает справа, назад — возвращается слева (как push/pop в нативной навигации);
  // между разделами (вкладки) и на десктопе — прежнее мягкое проявление.
  const slide = isMobile && direction !== 'none';
  const enterX = !slide ? 0 : direction === 'forward' ? 28 : -20;

  return (
    <SidebarProvider className="bg-background md:bg-sidebar h-dvh">
      <AppSidebar />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:m-2 md:rounded-2xl md:border md:shadow-sm">
        <Header />
        <ScrollArea className="bg-background min-h-0 flex-1">
          {/* pb на мобиле — место под плавающий BottomNav: сам бар (64) + отступ от края (12) +
              вылет центральной «+» (10) + зона плавного перехода подложки (32) + запас.
              Прокрутка до конца оставляет последнюю строку целиком над панелью. */}
          {/* overflow-x-clip: экран при въезде на мгновение шире области — без этого мелькнула бы горизонтальная прокрутка. */}
          <div className="overflow-x-clip p-3 pb-[calc(7.5rem+var(--sab))] md:p-6">
            {/* Смена экрана — направленный переход (пружина) или мягкое проявление, см. useRouteDirection. */}
            <motion.div
              key={routeKey}
              initial={{ opacity: 0, x: enterX, y: slide ? 0 : 8 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={
                slide
                  ? { default: { type: 'spring', stiffness: 380, damping: 36, mass: 0.9 }, opacity: { duration: 0.2, ease: 'easeOut' } }
                  : { duration: 0.22, ease: 'easeOut' }
              }>
              <Outlet />
              <PageNote />
            </motion.div>
          </div>
        </ScrollArea>
      </div>
      <BottomNav />
      <SuccessDialog />
    </SidebarProvider>
  );
}
