import { redirect } from 'react-router';
import { getClientUser } from '~/lib/auth-utils';
import { Role } from '~/types/common';

export function clientLoader() {
  const user = getClientUser();
  if (user?.role === Role.Seller) {
    return redirect('/transactions');
  }
  return redirect('/dashboard');
}

export default function IndexRoute() {
  return null;
}
