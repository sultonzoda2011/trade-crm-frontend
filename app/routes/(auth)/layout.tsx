import { Outlet } from 'react-router';
import { useHideNativeSplash } from '~/hooks/useHideNativeSplash';

export default function AuthLayout() {
  useHideNativeSplash();

  return (
    <div className="bg-background grid min-h-dvh w-full grid-cols-1 overflow-x-hidden lg:h-dvh lg:grid-cols-2">
      <Outlet />
    </div>
  );
}
