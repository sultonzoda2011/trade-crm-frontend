import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
} from '~/components/ui/sidebar';
import { getSidebarConfig, getVisibleNavigation } from '~/config/navigation';
import { useCan } from '~/hooks/useCan';
import { NavMain } from '~/components/layout/NavMain';


import lightLogo from '/light-logo.png';
import darkLogo from '/dark-logo.png';
import { Link } from 'react-router'

export function AppSidebar() {
  const { can, user } = useCan();
  const { t } = useTranslation();

  const navConfig = useMemo(() => getSidebarConfig(t, user?.marketId), [t, user?.marketId]);
  const visibleItems = useMemo(
    () => getVisibleNavigation(navConfig, can),
    [navConfig, can]
  );

  return (
    <Sidebar collapsible="icon" className="mt-2 border-none">
      <SidebarHeader className="px-2">
        <div className="flex items-center justify-start group-data-[collapsible=icon]:justify-center">
          {/* Full logo */}
          <Link to='/' className="flex items-center px-2 group-data-[collapsible=icon]:hidden">
            <img src={lightLogo} className="h-12 w-auto object-contain dark:hidden" alt="Trade CRM" />
            <img src={darkLogo} className="hidden h-12 w-auto object-contain dark:block" alt="Trade CRM" />
          </Link>

          {/* Small logo */}
          <div className="hidden items-center justify-center group-data-[collapsible=icon]:flex">
            <img src={lightLogo} className="size-8 object-contain dark:hidden" alt="Trade CRM" />
            <img src={darkLogo} className="hidden size-8 object-contain dark:block" alt="Trade CRM" />
          </div>
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
