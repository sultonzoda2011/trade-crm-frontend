import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';

export default [
  layout('routes/(auth)/layout.tsx', [route('login', 'routes/(auth)/login/route.tsx')]),

  layout('routes/(crm)/layout.tsx', [
    index('routes/(crm)/dashboard/route.tsx'),
    route('/profile', 'routes/(crm)/profile/route.tsx'),
    route('/users', 'routes/(crm)/users/route.tsx'),
    route('/users/:id', 'routes/(crm)/users/id/route.tsx'),
    route('/markets', 'routes/(crm)/markets/route.tsx'),
    route('/my-market', 'routes/(crm)/my-market/route.tsx'),
    route('/markets/:id', 'routes/(crm)/markets/id/route.tsx'),
    route('/sellers', 'routes/(crm)/sellers/route.tsx'),
    route('/sellers/:id', 'routes/(crm)/sellers/id/route.tsx'),
    route('/products', 'routes/(crm)/products/route.tsx'),
    route('/products/create', 'routes/(crm)/products/create/route.tsx'),
    route('/products/:id', 'routes/(crm)/products/id/route.tsx'),
    route('/products/:id/edit', 'routes/(crm)/products/id/edit/route.tsx'),
    route('/categories', 'routes/(crm)/categories/route.tsx'),
    route('/categories/:id', 'routes/(crm)/categories/id/route.tsx'),
    route('/dashboard/sellers-report', 'routes/(crm)/dashboard/sellers-report.tsx'),
    route('/debtors', 'routes/(crm)/debtors/route.tsx'),
    route('/debtors/:id', 'routes/(crm)/debtors/id/route.tsx'),
    route('/transactions', 'routes/(crm)/transactions/route.tsx'),
    route('/transactions/create', 'routes/(crm)/transactions/create/route.tsx'),
    route('/transactions/:id', 'routes/(crm)/transactions/id/route.tsx'),
  ]),
] satisfies RouteConfig;
