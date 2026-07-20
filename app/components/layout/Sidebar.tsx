import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader } from '~/components/ui/sidebar';
import { getSidebarConfig, getVisibleNavigation } from '~/config/navigation';
import { useCan } from '~/hooks/useCan';
import { NavMain } from './NavMain';

export function AppSidebar() {
  const { can } = useCan();
  const { t } = useTranslation();

  const navConfig = useMemo(() => getSidebarConfig(t), [t]);
  const visibleItems = useMemo(() => getVisibleNavigation(navConfig, can), [navConfig, can]);

  return (
    <Sidebar collapsible="icon" className="mt-2 border-none">
      <SidebarHeader className="px-4 py-3">
        <span className="text-base font-bold group-data-[collapsible=icon]:hidden">Trade CRM</span>
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
