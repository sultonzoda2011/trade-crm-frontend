import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { NavMain } from '~/components/layout/NavMain';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader } from '~/components/ui/sidebar';
import { getSidebarConfig, getVisibleNavigation } from '~/config/navigation';
import { useCan } from '~/hooks/useCan';

import { Link } from 'react-router';
import darkFavicon from '/dark-favicon.png';
import lightFavicon from '/light-favicon.png';
import darkLogo from '/logo-text-in-left-dark.png';
import lightLogo from '/logo-text-in-left-light.png';
export function AppSidebar() {
  const { can, user } = useCan();
  const { t } = useTranslation();

  const navConfig = useMemo(() => getSidebarConfig(t, user?.marketId), [t, user?.marketId]);
  const visibleItems = useMemo(() => getVisibleNavigation(navConfig, can), [navConfig, can]);

  return (
    <Sidebar collapsible="icon" className="mt-2 border-none">
      <SidebarHeader className="px-2">
        <div className="flex items-center justify-start group-data-[collapsible=icon]:justify-center">
          {/* Full  */}
          <Link to="/" className="flex items-center p-2 group-data-[collapsible=icon]:hidden">
            <img src={lightLogo} className="size-[50%] object-contain dark:hidden" alt="Trade CRM" />
            <img src={darkLogo} className="hidden size-[50%] object-contain dark:block" alt="Trade CRM" />
          </Link>

          {/* Small favicon */}
          <Link to="/" className="hidden items-center pt-2 pb-4 group-data-[collapsible=icon]:flex">
            <img src={lightFavicon} className="size-8 object-contain dark:hidden" alt="Trade CRM" />
            <img src={darkFavicon} className="hidden size-8 object-contain dark:block" alt="Trade CRM" />
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <NavMain items={visibleItems} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
