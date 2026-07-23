import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';

export default [
  layout('routes/(auth)/layout.tsx', [route('login', 'routes/(auth)/login/route.tsx')]),

  layout('routes/(crm)/layout.tsx', [
    index('routes/(crm)/dashboard/route.tsx'),
    route('/users', 'routes/(crm)/users/route.tsx'),
    route('/users/:id', 'routes/(crm)/users/id/route.tsx'),
    route('/markets', 'routes/(crm)/markets/route.tsx'),
    route('/markets/:id', 'routes/(crm)/markets/id/route.tsx'),
    route('/sellers', 'routes/(crm)/sellers/route.tsx'),
    route('/sellers/:id', 'routes/(crm)/sellers/id/route.tsx'),
    route('/products', 'routes/(crm)/products/route.tsx'),
    route('/products/:id', 'routes/(crm)/products/id/route.tsx'),
    route('/debtors', 'routes/(crm)/debtors/route.tsx'),
    route('/debtors/:id', 'routes/(crm)/debtors/id/route.tsx'),
    route('/transactions', 'routes/(crm)/transactions/route.tsx'),
    route('/transactions/:id', 'routes/(crm)/transactions/id/route.tsx'),
  ]),
] satisfies RouteConfig;
