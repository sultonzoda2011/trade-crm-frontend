import { Outlet, redirect } from 'react-router';
import { BottomNav } from '~/components/layout/BottomNav';
import { PageNote } from '~/components/layout/PageNote';
import Header from '~/components/layout/Header';
import { AppSidebar } from '~/components/layout/Sidebar';
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
  return (
    <SidebarProvider className="bg-background md:bg-sidebar h-dvh">
      <AppSidebar />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:m-2 md:rounded-2xl md:border md:shadow-sm">
        <Header />
        <ScrollArea className="bg-background min-h-0 flex-1">
          {/* pb на мобиле — место под плавающий BottomNav (сам бар + отступ от
              края + вылет центральной FAB-кнопки над баром). */}
          <div className="p-3 pb-[calc(6rem+env(safe-area-inset-bottom))] md:p-6">
            <Outlet />
            <PageNote />
          </div>
        </ScrollArea>
      </div>
      <BottomNav />
    </SidebarProvider>
  );
}
