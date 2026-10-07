import { motion } from 'motion/react';
import { Outlet, redirect, useLocation } from 'react-router';
import { BottomNav } from '~/components/layout/BottomNav';
import { PageNote } from '~/components/layout/PageNote';
import Header from '~/components/layout/Header';
import { AppSidebar } from '~/components/layout/Sidebar';
import { SuccessDialog } from '~/components/shared/SuccessDialog';
import { ScrollArea } from '~/components/ui/scroll-area';
import { SidebarProvider } from '~/components/ui/sidebar';
import { canAccess } from '~/config/permissions';
import { getClientUser } from '~/lib/auth-utils';
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

export default function CrmLayout() {
  const { pathname } = useLocation();
  // Вкладки дашборда — один экран: общий заголовок и фильтры не должны мигать
  // при переключении, поэтому для них ключ один и тот же.
  const routeKey = pathname.startsWith('/dashboard') ? '/dashboard' : pathname;

  return (
    <SidebarProvider className="bg-background md:bg-sidebar h-dvh">
      <AppSidebar />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:m-2 md:rounded-2xl md:border md:shadow-sm">
        <Header />
        <ScrollArea className="bg-background min-h-0 flex-1">
          {/* pb на мобиле — место под плавающий BottomNav (сам бар + отступ от
              края + вылет центральной FAB-кнопки над баром). */}
          <div className="p-3 pb-[calc(6rem+env(safe-area-inset-bottom))] md:p-6">
            {/* Мягкое появление при смене экрана — переход ощущается как в приложении, а не как перезагрузка страницы. */}
            <motion.div
              key={routeKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}>
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
