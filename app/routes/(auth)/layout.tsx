import { Outlet } from "react-router";

export default function AuthLayout() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <Outlet />
    </div>
  );
}
