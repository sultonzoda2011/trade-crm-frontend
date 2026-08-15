import { ChevronRight } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router';
import { Badge } from '~/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '~/components/ui/collapsible';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '~/components/ui/sidebar';
import type { NavItem } from '~/config/navigation';

interface NavMainProps {
  items: NavItem[];
}

export function NavMain({ items }: NavMainProps) {
  const { t } = useTranslation();
  const { state, setOpen: setSidebarOpen } = useSidebar();
  const location = useLocation();

  const getActiveGroup = (pathname: string) =>
    items.find((item) => item.items?.some((sub) => sub.url === pathname))?.title ?? null;

  const [openGroup, setOpenGroup] = useState<string | null>(() => getActiveGroup(location.pathname));

  // Синхронизируем при навигации в страницу внутри группы — без useEffect, прямо в рендере
  const prevPathname = useRef(location.pathname);
  if (prevPathname.current !== location.pathname) {
    prevPathname.current = location.pathname;
    const activeGroup = getActiveGroup(location.pathname);
    if (activeGroup !== null && activeGroup !== openGroup) {
      setOpenGroup(activeGroup);
    }
  }

  const handleGroupTrigger = useCallback(
    (title: string, isOpen: boolean) => {
      if (state === 'collapsed' && isOpen) setSidebarOpen(true);
      setOpenGroup(isOpen ? title : null);
    },
    [state, setSidebarOpen]
  );

  return (
    <SidebarMenu className="flex flex-col gap-1">
      {items.map((item) => {
        const hasSubItems = !!(item.items && item.items.length > 0);
        const isCurrentGroupOpen = openGroup === item.title;
        const isGroupActive = getActiveGroup(location.pathname) === item.title;

        if (hasSubItems) {
          return (
            <Collapsible
              key={item.title}
              open={isCurrentGroupOpen}
              onOpenChange={(isOpen) => handleGroupTrigger(item.title, isOpen)}
              className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger
                  render={<SidebarMenuButton tooltip={item.title} isActive={isCurrentGroupOpen || isGroupActive} />}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
                </CollapsibleTrigger>

                <CollapsibleContent className="sidebar-collapsible-content">
                  <SidebarMenuSub>
                    {item.items!.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <NavLink
                          to={subItem.comingSoon ? '#' : subItem.url || '#'}
                          className="block w-full"
                          onClick={(e) => {
                            if (subItem.comingSoon) e.preventDefault();
                          }}>
                          {({ isActive }) => (
                            <SidebarMenuSubButton
                              isActive={isActive && !subItem.comingSoon}
                              render={
                                <div
                                  className={`flex w-full items-center justify-between ${
                                    subItem.comingSoon ? 'pointer-events-none opacity-50' : ''
                                  }`}
                                />
                              }>
                              <span className="truncate">{subItem.title}</span>
                              {subItem.comingSoon && (
                                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                                  {t('navigation.comingSoon')}
                                </Badge>
                              )}
                            </SidebarMenuSubButton>
                          )}
                        </NavLink>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        }

        return (
          <SidebarMenuItem key={item.title}>
            <NavLink
              to={item.comingSoon ? '#' : item.url || '#'}
              end={item.url === '/'}
              className="block w-full"
              onClick={(e) => {
                if (item.comingSoon) {
                  e.preventDefault();
                } else {
                  setOpenGroup(null);
                }
              }}>
              {({ isActive }) => (
                <SidebarMenuButton
                  isActive={isActive && !item.comingSoon && openGroup === null}
                  tooltip={item.title}
                  className={item.comingSoon ? 'opacity-50' : ''}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  {item.comingSoon && (
                    <Badge variant="outline" className="ml-auto h-4 px-1.5 text-[10px]">
                      {t('navigation.comingSoon')}
                    </Badge>
                  )}
                </SidebarMenuButton>
              )}
            </NavLink>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
