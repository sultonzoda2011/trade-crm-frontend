import { Outlet, useLocation } from 'react-router';
import Header from '~/components/layout/Header';
import { AppSidebar } from '~/components/layout/Sidebar';
import { SidebarProvider } from '~/components/ui/sidebar';
import { requireAuth } from '~/lib/auth-utils';
import type { Route } from './+types/layout';

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const result = requireAuth(request);
  return result || {};
}

export default function CrmLayout() {
  const location = useLocation();

  return (
    <SidebarProvider className="bg-sidebar h-dvh">
      <AppSidebar />
      <div className="m-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm">
        <Header />
        <main className="bg-background scrollbar-hide min-h-0 flex-1 overflow-y-auto p-3 md:p-6">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
