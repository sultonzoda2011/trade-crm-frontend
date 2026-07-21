import type { TFunction } from 'i18next';
import { LayoutDashboard, Package, Store, Users } from 'lucide-react';
import type { Permission } from '~/hooks/useCan';
import type { Role } from '~/types/common';
import { Action } from './actions';

export interface NavItem {
  title: string;
  url?: string;
  icon?: any;
  action?: Action | Action[];
  roles?: Role[];
  items?: NavItem[];
  comingSoon?: boolean;
}

export const getSidebarConfig = (t: TFunction): NavItem[] => [
  {
    title: t('navigation.dashboard'),
    url: '/',
    icon: LayoutDashboard,
    action: Action.DASHBOARDS_VIEW,
  },
  {
    title: t('navigation.users'),
    url: '/users',
    icon: Users,
    action: Action.USERS_VIEW,
  },
  {
    title: t('navigation.markets'),
    url: '/markets',
    icon: Package,
    action: Action.MARKETS_VIEW,
  },
   {
    title: t('navigation.sellers'),
    url: '/sellers',
    icon: Store,
    action: Action.SELLERS_VIEW,
  },
];

/**
 * Фильтрует пункты навигации на основе функции проверки прав (can).
 */
export function getVisibleNavigation(items: NavItem[], can: (p: Permission) => boolean): NavItem[] {
  return items
    .filter((item) => {
      // 1. Если есть подпункты, рекурсивно проверяем их
      if (item.items) {
        const visibleSubItems = getVisibleNavigation(item.items, can);
        return visibleSubItems.length > 0;
      }

      if (item.action) {
        return can(item.action);
      }

      if (item.roles) {
        return can(item.roles);
      }

      return true;
    })
    .map((item) => ({
      ...item,
      items: item.items ? getVisibleNavigation(item.items, can) : undefined,
    }));
}
