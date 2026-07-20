import { matchPath } from 'react-router';
import { Role } from '~/types/auth';

/**
 * Карта прав доступа для роутов.
 */
export const ROUTE_PERMISSIONS: Record<string, Role[]> = {
  '/dashboard': [Role.Admin, Role.Owner, Role.Seller],
};

export function canAccess(role: Role, pathname: string): boolean {
  const entries = Object.entries(ROUTE_PERMISSIONS);

  const matches = entries.filter(([pattern]) => matchPath({ path: pattern, end: true }, pathname));

  if (matches.length === 0) return true;

  matches.sort((a, b) => b[0].length - a[0].length);

  const [, allowedRoles] = matches[0];
  return allowedRoles.includes(role);
}
