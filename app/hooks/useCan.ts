import { Action, ACTION_PERMISSIONS } from '~/config/actions';
import { getClientUser } from '~/lib/auth-utils';
import { Role } from '~/types/common';

export type Permission = Role | Role[] | Action | Action[];

/**
 * Хук для проверки прав доступа в UI (кнопки, вкладки и т.д.)
 */
export function useCan() {
  const user = getClientUser();
  const userRole = user?.role;

  /**
   * Проверяет наличие доступа к действию или роли.
   */
  const can = (permission: Permission): boolean => {
    if (!userRole) return false;

    // 1. Если передан массив (Role[] или Action[])
    if (Array.isArray(permission)) {
      // Проверяем, есть ли хотя бы одно совпадение
      return (permission as any[]).some((p) => {
        if (Object.values(Action).includes(p as Action)) {
          return ACTION_PERMISSIONS[p as Action]?.includes(userRole);
        }
        return p === userRole;
      });
    }

    // 2. Если передано конкретное действие (Action)
    if (Object.values(Action).includes(permission as Action)) {
      const allowedRoles = ACTION_PERMISSIONS[permission as Action];
      return allowedRoles?.includes(userRole) ?? false;
    }

    // 3. Если передана конкретная роль (Role)
    return userRole === (permission as Role);
  };

  const canAny = (permissions: Permission[]): boolean => {
    return permissions.some((p) => can(p));
  };

  return { can, canAny, role: userRole, user };
}
