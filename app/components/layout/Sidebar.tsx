import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader } from '~/components/ui/sidebar';
import { getSidebarConfig, getVisibleNavigation } from '~/config/navigation';
import { useCan } from '~/hooks/useCan';
import { NavMain } from './NavMain';

import favicon from '/favicon.ico';
import logo from '/tradeLogo.png';

export function AppSidebar() {
  const { can } = useCan();
  const { t } = useTranslation();

  const navConfig = useMemo(() => getSidebarConfig(t), [t]);
  const visibleItems = useMemo(() => getVisibleNavigation(navConfig, can), [navConfig, can]);

  return (
    <Sidebar collapsible="icon" className="mt-2 border-none">
      <SidebarHeader className="px-2 ">
        <div className="flex items-center justify-start group-data-[collapsible=icon]:justify-center">
          {/* Full logo */}
          <img src={logo} className="h-12 w-auto object-contain group-data-[collapsible=icon]:hidden" alt="Trade CRM" />

          {/* Small logo */}
          <img
            src={favicon}
            className="hidden h-8 w-8 object-contain group-data-[collapsible=icon]:block"
            alt="Trade CRM"
          />
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
