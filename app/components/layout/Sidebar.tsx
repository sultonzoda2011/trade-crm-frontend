import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { NavMain } from '~/components/layout/NavMain';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader } from '~/components/ui/sidebar';
import { getSidebarConfig, getVisibleNavigation } from '~/config/navigation';
import { useCan } from '~/hooks/useCan';

import { Link } from 'react-router';
import darkLogo from '/dark-logo.png';
import lightLogo from '/light-logo.png';

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
          <Link to="/" className="flex items-center px-2 pt-2 pb-4 group-data-[collapsible=icon]:hidden">
            <p className="font-bold">TradeCRM</p>
          </Link>

          {/* Small logo */}
          <Link to="/" className="hidden items-center pt-2 pb-4 group-data-[collapsible=icon]:flex">
            <img src={lightLogo} className="size-8 object-contain dark:hidden" alt="Trade CRM" />
            <img src={darkLogo} className="hidden size-8 object-contain dark:block" alt="Trade CRM" />
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
