import { Outlet } from 'react-router';

export default function AuthLayout() {
  return (
    <div className="bg-background grid min-h-dvh w-full grid-cols-1 overflow-x-hidden lg:h-dvh lg:grid-cols-2">
      <Outlet />
    </div>
  );
}
