import { Outlet } from 'react-router';

export default function AuthLayout() {
  return (
    <div className="grid h-dvh grid-cols-1 lg:grid-cols-2">
      <Outlet />
    </div>
  );
}
