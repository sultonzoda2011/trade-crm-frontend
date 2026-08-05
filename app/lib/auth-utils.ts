import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { redirect } from 'react-router';
import { canAccess } from '~/config/permissions';
import type { Role } from '~/types/common';

export interface DecodedToken {
  sub: string;
  email: string;
  role: Role;
  marketId: string;
  id: string;
  name: string;
  image: string | null;
  iat: string;
  exp: number;
}

export const getAuthToken = () => Cookies.get('token');

export const getRefreshToken = () => Cookies.get('refreshToken');

export const getUserFromToken = (): DecodedToken | null => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    return jwtDecode<DecodedToken>(token);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const { exp } = jwtDecode<DecodedToken>(token);
    if (!exp) return false;
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
};

/**
 * Защищает роут. Проверяет авторизацию и права доступа (RBAC).
 * Использовать в loaders.
 */
export function requireAuth(request: Request) {
  const token = getAuthToken();
  const url = new URL(request.url);

  if (!token || isTokenExpired(token)) {
    const params = new URLSearchParams();
    params.set('redirectTo', url.pathname);
    return redirect(`/login?${params.toString()}`);
  }

  const user = getUserFromToken();
  if (user && !canAccess(user.role, url.pathname)) {
    return redirect('/');
  }

  return { user, token };
}
