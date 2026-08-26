import type { TFunction } from 'i18next';
import { BookOpen, Building2, HandCoins, LayoutDashboard, Package, ReceiptText, Store, Tag, UserRound, Users } from 'lucide-react';
import type { Permission } from '~/hooks/useCan';
import { Role } from '~/types/common';
import { Action } from '~/config/actions';

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
    url: '/dashboard',
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
    icon: Store,
    action: Action.MARKETS_VIEW,
  },
  {
    title: t('navigation.myMarket'),
    url: '/my-market',
    icon: Building2,
    // Гейтим по роли, а не по MARKETS_VIEW_BY_ID: это действие разрешено
    // ADMIN+OWNER, а сам роут /my-market — только OWNER (ROUTE_PERMISSIONS),
    // поэтому у ADMIN ссылка вела бы прямиком на /403.
    roles: [Role.Owner],
  },
  {
    title: t('navigation.sellers'),
    url: '/sellers',
    icon: UserRound,
    action: Action.SELLERS_VIEW,
  },
  {
    title: t('navigation.products'),
    url: '/products',
    icon: Package,
    action: Action.PRODUCTS_VIEW,
  },
  {
    title: t('navigation.categories'),
    url: '/categories',
    icon: Tag,
    action: Action.CATEGORIES_MANAGE,
  },
  {
    title: t('navigation.debtors'),
    url: '/debtors',
    icon: HandCoins,
    action: Action.DEBTORS_VIEW,
  },
  {
    title: t('navigation.transactions'),
    url: '/transactions',
    icon: ReceiptText,
    action: Action.TRANSACTIONS_VIEW,
  },
  {
    // Справочник виден всем ролям — ни action, ни roles не задаём.
    title: t('navigation.guide'),
    url: '/guide',
    icon: BookOpen,
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
