import { ChevronRight } from 'lucide-react';
import { Fragment, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '~/components/ui/collapsible';
import {
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from '~/components/ui/sidebar';
import type { NavItem, NavSection } from '~/config/navigation';

const SECTION_LABEL_KEY: Record<NavSection, string> = {
  control: 'navigation.groups.control',
  main: 'navigation.groups.main',
  trade: 'navigation.groups.trade',
  catalog: 'navigation.groups.catalog',
  team: 'navigation.groups.team',
};

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

  // Заголовки секций рисуются только между видимыми пунктами (роль могла
  // скрыть все пункты какой-то секции) — поэтому просто сравниваем section
  // текущего пункта с предыдущим в уже отфильтрованном списке, а не с
  // статическим конфигом. Пункт без section (guide) идёт после разделителя,
  // без подписи.
  let prevSection: NavSection | undefined;

  return (
    <SidebarMenu className="flex flex-col gap-1">
      {items.map((item) => {
        const sectionHeader =
          item.section && item.section !== prevSection ? (
            <SidebarGroupLabel key={`section-${item.section}`}>{t(SECTION_LABEL_KEY[item.section])}</SidebarGroupLabel>
          ) : null;
        const tailSeparator =
          !item.section && prevSection ? <SidebarSeparator key="section-end" className="my-1" /> : null;
        prevSection = item.section;

        const hasSubItems = !!(item.items && item.items.length > 0);
        const isCurrentGroupOpen = openGroup === item.title;
        const isGroupActive = getActiveGroup(location.pathname) === item.title;

        if (hasSubItems) {
          return (
            <Fragment key={item.title}>
              {sectionHeader}
              {tailSeparator}
              <Collapsible
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
                          <NavLink to={subItem.url || '#'} className="block w-full">
                            {({ isActive }) => (
                              <SidebarMenuSubButton
                                isActive={isActive}
                                render={<div className="flex w-full items-center justify-between" />}>
                                <span className="truncate">{subItem.title}</span>
                              </SidebarMenuSubButton>
                            )}
                          </NavLink>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </Fragment>
          );
        }

        return (
          <Fragment key={item.title}>
            {sectionHeader}
            {tailSeparator}
            <SidebarMenuItem>
              <NavLink
                to={item.url || '#'}
                end={item.url === '/'}
                className="block w-full"
                onClick={() => setOpenGroup(null)}>
                {({ isActive }) => (
                  <SidebarMenuButton isActive={isActive && openGroup === null} tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                )}
              </NavLink>
            </SidebarMenuItem>
          </Fragment>
        );
      })}
    </SidebarMenu>
  );
}
