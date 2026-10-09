import type { TFunction } from 'i18next';
import {
  BookOpen,
  Building2,
  HandCoins,
  LayoutDashboard,
  Package,
  ReceiptText,
  Store,
  Tag,
  UserRound,
  Users,
} from 'lucide-react';
import type { Permission } from '~/hooks/useCan';
import { Action } from '~/config/actions';

/** Стабильный id пункта — используется для группировки в сайдбаре и выбора вкладок BottomNav (title уже переведён и для этого не подходит). */
export type NavKey =
  | 'dashboard'
  | 'users'
  | 'markets'
  | 'myMarket'
  | 'sellers'
  | 'products'
  | 'categories'
  | 'debtors'
  | 'transactions'
  | 'guide';

/** Секция для заголовков-разделителей в сайдбаре. Пункты без section (guide) рисуются отдельно, под разделителем, без заголовка. */
export type NavSection = 'control' | 'main' | 'trade' | 'catalog' | 'team';

export interface NavItem {
  key?: NavKey;
  title: string;
  url?: string;
  icon?: any;
  action?: Action | Action[];
  items?: NavItem[];
  section?: NavSection;
}

/**
 * Порядок приоритета вкладок в BottomNav. Совпадает с BottomNav.tsx.
 * Экспортируется отдельно, чтобы useTabNeighbors мог вычислять соседей
 * без импорта React-компонента (избегаем circular deps).
 */
export const PRIMARY_ORDER: NavKey[] = [
  'dashboard',
  'transactions',
  'debtors',
  'products',
  'myMarket',
  'sellers',
  'categories',
];

/** Количество основных слотов в BottomNav (не считая «+» и «Ещё»). */
export const PRIMARY_SLOTS = 3;

export const getSidebarConfig = (t: TFunction, marketId?: string): NavItem[] => [
  {
    key: 'users',
    title: t('navigation.users'),
    url: '/users',
    icon: Users,
    action: Action.USERS_VIEW,
    section: 'control',
  },
  {
    key: 'markets',
    title: t('navigation.markets'),
    url: '/markets',
    icon: Store,
    action: Action.MARKETS_VIEW,
    section: 'control',
  },
  {
    key: 'dashboard',
    title: t('navigation.dashboard'),
    url: '/dashboard',
    icon: LayoutDashboard,
    action: Action.DASHBOARDS_VIEW,
    section: 'main',
  },
  {
    key: 'myMarket',
    title: t('navigation.myMarket'),
    url: marketId ? `/markets/${marketId}` : '/markets',
    icon: Building2,
    action: Action.MY_MARKET,
    section: 'main',
  },
  {
    key: 'transactions',
    title: t('navigation.transactions'),
    url: '/transactions',
    icon: ReceiptText,
    action: Action.TRANSACTIONS_VIEW,
    section: 'trade',
  },
  {
    key: 'debtors',
    title: t('navigation.debtors'),
    url: '/debtors',
    icon: HandCoins,
    action: Action.DEBTORS_VIEW,
    section: 'trade',
  },
  {
    key: 'products',
    title: t('navigation.products'),
    url: '/products',
    icon: Package,
    action: Action.PRODUCTS_VIEW,
    section: 'catalog',
  },
  {
    key: 'categories',
    title: t('navigation.categories'),
    url: '/categories',
    icon: Tag,
    action: Action.CATEGORIES_MANAGE,
    section: 'catalog',
  },
  {
    key: 'sellers',
    title: t('navigation.sellers'),
    url: '/sellers',
    icon: UserRound,
    action: Action.SELLERS_VIEW,
    section: 'team',
  },
  {
    // Справочник виден всем ролям — action не задаём. Без section — рисуется под разделителем, как отдельный пункт.
    key: 'guide',
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

      return true;
    })
    .map((item) => ({
      ...item,
      items: item.items ? getVisibleNavigation(item.items, can) : undefined,
    }));
}
