import { useCallback } from 'react';
import { Action, ACTION_PERMISSIONS } from '~/config/actions';
import { getClientUser } from '~/lib/auth-utils';
import { Role } from '~/types/common';

export type Permission = Role | Role[] | Action | Action[];

const ACTION_SET = new Set<string>(Object.values(Action));

function matchesSinglePermission(userRole: Role, item: Role | Action): boolean {
  if (ACTION_SET.has(item)) {
    return ACTION_PERMISSIONS[item as Action]?.includes(userRole) ?? false;
  }
  return item === userRole;
}

/**
 * Хук для проверки прав доступа в UI (кнопки, вкладки и т.д.)
 */
export function useCan() {
  const user = getClientUser();
  const userRole = user?.role;

  /**
   * Проверяет наличие доступа к действию или роли.
   */
  const can = useCallback(
    (permission: Permission): boolean => {
      if (!userRole) return false;
      if (Array.isArray(permission)) {
        return permission.some((p) => matchesSinglePermission(userRole, p));
      }
      return matchesSinglePermission(userRole, permission);
    },
    [userRole]
  );

  return { can, role: userRole, user };
}

