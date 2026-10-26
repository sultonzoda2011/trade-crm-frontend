import { matchPath } from 'react-router';
import { Action, ACTION_PERMISSIONS } from '~/config/actions';
import { Role } from '~/types/common';

const ALL_ROLES = [Role.Admin, Role.Owner, Role.Seller];

/**
 * Карта прав доступа для роутов.
 * Дублирующие action-правила берутся напрямую из `ACTION_PERMISSIONS`, чтобы
 * видимость кнопки в UI и защита самого URL не расходились.
 */
export const ROUTE_PERMISSIONS: Record<string, Role[]> = {
  '/dashboard': ACTION_PERMISSIONS[Action.DASHBOARDS_VIEW],
  '/dashboard/inventory': ACTION_PERMISSIONS[Action.DASHBOARDS_VIEW],
  '/dashboard/products': ACTION_PERMISSIONS[Action.DASHBOARDS_VIEW],
  '/dashboard/sellers': ACTION_PERMISSIONS[Action.DASHBOARDS_VIEW],
  '/profile': ALL_ROLES,
  '/users': ACTION_PERMISSIONS[Action.USERS_VIEW],
  '/users/create': ACTION_PERMISSIONS[Action.USERS_CREATE],
  '/users/:id': ACTION_PERMISSIONS[Action.USERS_VIEW],
  '/users/:id/edit': ACTION_PERMISSIONS[Action.USERS_EDIT],
  '/markets': ACTION_PERMISSIONS[Action.MARKETS_VIEW],
  '/markets/create': ACTION_PERMISSIONS[Action.MARKETS_CREATE],
  '/markets/:id': ACTION_PERMISSIONS[Action.MARKETS_VIEW_BY_ID],
  '/markets/:id/edit': ACTION_PERMISSIONS[Action.MARKETS_EDIT],
  '/sellers': ACTION_PERMISSIONS[Action.SELLERS_VIEW],
  '/sellers/create': ACTION_PERMISSIONS[Action.SELLERS_CREATE],
  '/sellers/:id': ACTION_PERMISSIONS[Action.SELLERS_VIEW],
  '/sellers/:id/edit': ACTION_PERMISSIONS[Action.SELLERS_EDIT],
  '/products': ACTION_PERMISSIONS[Action.PRODUCTS_VIEW],
  '/products/create': ACTION_PERMISSIONS[Action.PRODUCTS_CREATE],
  '/products/:id': ACTION_PERMISSIONS[Action.PRODUCTS_VIEW],
  '/products/:id/edit': ACTION_PERMISSIONS[Action.PRODUCTS_EDIT],
  '/transactions': ACTION_PERMISSIONS[Action.TRANSACTIONS_VIEW],
  '/transactions/create': ACTION_PERMISSIONS[Action.TRANSACTIONS_CREATE],
  '/transactions/:id': ACTION_PERMISSIONS[Action.TRANSACTIONS_VIEW],
  '/categories': [Role.Admin, Role.Owner],
  '/categories/create': ACTION_PERMISSIONS[Action.CATEGORIES_MANAGE],
  '/categories/:id': [Role.Admin, Role.Owner],
  '/categories/:id/edit': ACTION_PERMISSIONS[Action.CATEGORIES_MANAGE],
  '/debtors': ACTION_PERMISSIONS[Action.DEBTORS_VIEW],
  '/debtors/create': ACTION_PERMISSIONS[Action.DEBTORS_CREATE],
  '/debtors/:id': ACTION_PERMISSIONS[Action.DEBTORS_VIEW],
  '/debtors/:id/edit': ACTION_PERMISSIONS[Action.DEBTORS_EDIT],
  '/sync': ALL_ROLES,
  '/guide': ALL_ROLES,
  '/403': ALL_ROLES,
};

const ROUTE_PERMISSION_ENTRIES = Object.entries(ROUTE_PERMISSIONS).sort((a, b) => b[0].length - a[0].length);

export function canAccess(role: Role, pathname: string): boolean {
  const match = ROUTE_PERMISSION_ENTRIES.find(([pattern]) => matchPath({ path: pattern, end: true }, pathname));
  if (!match) return true;
  return match[1].includes(role);
}
