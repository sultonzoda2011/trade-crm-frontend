import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader } from '~/components/ui/sidebar';
import { getSidebarConfig, getVisibleNavigation } from '~/config/navigation';
import { useCan } from '~/hooks/useCan';
import { NavMain } from '~/components/layout/NavMain';

import darkFavicon from '/dark-favicon.png';
import lightFavicon from '/light-favicon.png';
import textInRightDark from '/text-in-right-logo-dark.png';
import textInRightLight from '/text-in-right-logo-light.png';

export function AppSidebar() {
  const { can } = useCan();
  const { t } = useTranslation();

  const navConfig = useMemo(() => getSidebarConfig(t), [t]);
  const visibleItems = useMemo(() => getVisibleNavigation(navConfig, can), [navConfig, can]);

  return (
    <Sidebar collapsible="icon" className="mt-2 border-none">
      <SidebarHeader className="px-2">
        <div className="flex items-center justify-start group-data-[collapsible=icon]:justify-center">
          {/* Full logo */}
          <div className="flex items-center p-2 group-data-[collapsible=icon]:hidden">
            <img src={textInRightLight} className="h-10 w-auto object-contain dark:hidden" alt="Trade CRM" />
            <img src={textInRightDark} className="hidden h-10 w-auto object-contain dark:block" alt="Trade CRM" />
          </div>

          {/* Small logo */}
          <div className="hidden items-center justify-center group-data-[collapsible=icon]:flex">
            <img src={lightFavicon} className="h-8 w-8 object-contain dark:hidden" alt="Trade CRM" />
            <img src={darkFavicon} className="hidden h-8 w-8 object-contain dark:block" alt="Trade CRM" />
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
