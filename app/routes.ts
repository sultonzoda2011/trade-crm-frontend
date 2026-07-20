import { type RouteConfig, layout, route } from '@react-router/dev/routes';

export default [
  layout('routes/(auth)/layout.tsx', [route('login', 'routes/(auth)/login/route.tsx')]),

  layout('routes/(crm)/layout.tsx', [route('dashboard', 'routes/(crm)/dashboard/route.tsx')]),
] satisfies RouteConfig;
