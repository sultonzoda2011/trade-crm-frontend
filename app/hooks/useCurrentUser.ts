import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { profileApi } from '~/api/profile';
import { getClientUser, setUserInfo, type UserInfo } from '~/lib/auth-utils';
import { queryKeys } from '~/lib/query-keys';

/**
 * The signed-in user as the shell should show them: name, email and **photo**.
 *
 * The session in localStorage is written at login, and the login response has
 * no photo (and goes stale the moment someone edits their profile) — which is
 * why the header showed initials even for people with an avatar. This reads the
 * stored user for an instant first paint, then loads `/profile` and lays the
 * fresh values over it. Whatever differs is written back to storage, so the next
 * cold start (Capacitor relaunch) paints the avatar immediately.
 *
 * `role` and `marketId` stay with the stored session — they drive RBAC and
 * routing, and nothing here is allowed to change them.
 */
export function useCurrentUser(): UserInfo | null {
  const stored = getClientUser();

  const { data } = useQuery({
    queryKey: queryKeys.me(),
    queryFn: () => profileApi.getProfile(),
    enabled: Boolean(stored),
    staleTime: 5 * 60_000,
  });

  const profile = data?.data;

  const name = profile?.name ?? stored?.name;
  const email = profile?.email ?? stored?.email;
  const image = profile ? profile.image : (stored?.image ?? null);

  const changed =
    Boolean(stored && profile) && (stored?.name !== name || stored?.email !== email || (stored?.image ?? null) !== image);

  useEffect(() => {
    if (!stored || !changed) return;
    setUserInfo({ ...stored, name: name ?? stored.name, email: email ?? stored.email, image });
    // `stored` is a fresh object every render; the primitives below are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changed, name, email, image]);

  if (!stored) return null;
  return { ...stored, name: name ?? stored.name, email: email ?? stored.email, image };
}
