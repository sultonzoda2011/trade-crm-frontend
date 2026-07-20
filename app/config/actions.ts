import { Role } from '~/types/auth';

export enum Action {
  DASHBOARD_VIEW = 'DASHBOARD_VIEW',
}

export const ACTION_PERMISSIONS: Record<Action, Role[]> = {
  [Action.DASHBOARD_VIEW]: [Role.Admin, Role.Owner, Role.Seller],
};
