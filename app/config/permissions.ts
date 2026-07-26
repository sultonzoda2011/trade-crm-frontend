import { matchPath } from 'react-router'
import { Role } from '~/types/common'

/**
 * Карта прав доступа для роутов.
 */
export const ROUTE_PERMISSIONS: Record<string, Role[]> = {
  '/dashboard': [Role.Admin, Role.Owner, Role.Seller],
  '/users': [Role.Admin],
  '/users/:id': [Role.Admin],
  '/markets/:id': [Role.Admin,Role.Owner],
  '/markets': [Role.Admin],
  '/sellers/:id': [Role.Admin, Role.Owner],
  '/sellers': [Role.Admin, Role.Owner],
  '/products/create': [Role.Admin, Role.Owner],
  '/products/:id': [Role.Admin, Role.Owner, Role.Seller],
  '/products/:id/edit': [Role.Admin, Role.Owner],
  '/products': [Role.Admin, Role.Owner, Role.Seller],
  '/transactions/:id': [Role.Admin, Role.Owner, Role.Seller],
  '/transactions': [Role.Admin, Role.Owner, Role.Seller],
  '/categories': [Role.Admin, Role.Owner],
  '/categories/:id': [Role.Admin, Role.Owner],
};

export function canAccess(role: Role, pathname: string): boolean {
  const entries = Object.entries(ROUTE_PERMISSIONS);

  const matches = entries.filter(([pattern]) => matchPath({ path: pattern, end: true }, pathname));

  if (matches.length === 0) return true;

  matches.sort((a, b) => b[0].length - a[0].length);

  const [, allowedRoles] = matches[0];
  return allowedRoles.includes(role);
}
