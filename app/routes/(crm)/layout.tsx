import { Outlet } from 'react-router';
import Header from '~/components/layout/Header';
import { AppSidebar } from '~/components/layout/Sidebar';
import { ScrollArea } from '~/components/ui/scroll-area';
import { SidebarProvider } from '~/components/ui/sidebar';
import { requireAuth } from '~/lib/auth-utils';
import type { Route } from './+types/layout';

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const result = requireAuth(request);
  return result || {};
}

export default function CrmLayout() {
  return (
    <SidebarProvider className="bg-sidebar h-dvh">
      <AppSidebar />
      <div className="m-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm">
        <Header />
        <ScrollArea className="bg-background min-h-0 flex-1">
          <div className="p-3 md:p-6">
            <Outlet />
          </div>
        </ScrollArea>
      </div>
    </SidebarProvider>
  );
}
