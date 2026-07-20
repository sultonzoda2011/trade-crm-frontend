import type { TFunction } from 'i18next';
import { ArrowDownToLine, ArrowUpFromLine, Landmark, LayoutDashboard } from 'lucide-react';
import type { Permission } from '~/hooks/useCan';
import { Role } from '~/types/auth';
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
    action: Action.DASHBOARD_VIEW,
  },
  // {
  //   title: t('navigation.finances'),
  //   icon: Landmark,
  //   items: [
  //     {
  //       title: t('navigation.income'),
  //       url: '/finance/income',
  //       icon: ArrowUpFromLine,
  //       action: Action.INCOME_VIEW,
  //     },
  //     {
  //       title: t('navigation.expenses'),
  //       url: '/finance/expenses',
  //       icon: ArrowDownToLine,
  //       action: Action.EXPENSES_VIEW,
  //     },
  //     {
  //       title: t('navigation.salary'),
  //       url: '/finance/salary',
  //       icon: Landmark,
  //       action: Action.SALARY_VIEW,
  //     },
  //   ],
  // },
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
