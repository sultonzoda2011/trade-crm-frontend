import { useQuery } from '@tanstack/react-query';
import { Package, Pencil, ReceiptText, Users } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router';
import { debtorsApi } from '~/api/debtors';
import { marketsApi } from '~/api/markets';
import { productsApi } from '~/api/products';
import { transactionsApi } from '~/api/transactions';
import { Panel } from '~/components/layout/Panel';
import { EditMarketModal } from '~/components/modals/EditMarketModal';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { DetailHeader } from '~/components/shared/DetailHeader';
import { EntityCard } from '~/components/shared/EntityCard';
import { InfoItem } from '~/components/shared/InfoItem';
import { InfoLink } from '~/components/shared/InfoLink';
import { ListLink } from '~/components/shared/ListLink';
import { MarketEntityTabs } from '~/components/shared/MarketEntityTabs';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import { QuickActions } from '~/components/shared/QuickActions';
import { StatCard } from '~/components/shared/StatCard';
import { StatRow } from '~/components/shared/StatRow';
import { UserAvatar } from '~/components/shared/UserAvatar';
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { getClientUser } from '~/lib/auth-utils';
import { fmtTJS, formatDate } from '~/lib/format';
import { useMarketsModals } from '~/routes/(crm)/markets/store';
import { Role } from '~/types/common';
import type { UserInfo } from '~/types/users';

function SellerAvatars({ sellers }: { sellers: UserInfo[] }) {
  if (sellers.length === 0) return null;
  const visible = sellers.slice(0, 3);
  const rest = sellers.length - visible.length;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <AvatarGroup data-size="sm">
            {visible.map((seller) => (
              <Avatar key={seller.id} size="sm">
                {seller.image ? <AvatarImage src={seller.image} alt={seller.name} /> : null}
                <AvatarFallback>{seller.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            ))}
            {rest > 0 && <AvatarGroupCount>+{rest}</AvatarGroupCount>}
          </AvatarGroup>
        }
      />
      <TooltipContent side="top">{sellers.map((seller) => seller.name).join(', ')}</TooltipContent>
    </Tooltip>
  );
}

export default function MyMarketPage() {
  const { t } = useTranslation(['markets', 'common', 'transactions']);
  const { marketId } = getClientUser() || {};
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useCan();
  const editModal = useMarketsModals((s) => s.edit);
  console.log(marketId);

  const { data: response, isLoading } = useQuery({
    queryKey: ['market', marketId],
    queryFn: () => marketsApi.getById(marketId!),
    enabled: !!marketId,
    staleTime: 30_000,
  });

  const market = response?.data;

  const { data: marketProductsResponse } = useQuery({
    queryKey: ['my-market-products-preview'],
    queryFn: () => productsApi.getAll(1, 100, {}, []),
    staleTime: 30_000,
  });

  const { data: marketDebtorsResponse } = useQuery({
    queryKey: ['my-market-debtors-preview'],
    queryFn: () => debtorsApi.getAll(1, 100, {}, []),
    staleTime: 30_000,
  });

  const { data: marketTransactionsResponse } = useQuery({
    queryKey: ['my-market-transactions-preview'],
    queryFn: () => transactionsApi.getAll(1, 100, {}, []),
    staleTime: 30_000,
  });

  const marketProducts = useMemo(() => marketProductsResponse?.data?.data ?? [], [marketProductsResponse]);
  const marketDebtors = useMemo(() => marketDebtorsResponse?.data?.data ?? [], [marketDebtorsResponse]);
  const marketTransactions = useMemo(() => marketTransactionsResponse?.data?.data ?? [], [marketTransactionsResponse]);

  const sellersByProduct = useMemo(() => {
    const map = new Map<string, UserInfo[]>();
    for (const tx of marketTransactions) {
      for (const item of tx.items) {
        const sellers = map.get(item.productId) ?? [];
        if (!sellers.some((seller) => seller.id === tx.createdBy.id)) {
          sellers.push(tx.createdBy);
          map.set(item.productId, sellers);
        }
      }
    }
    return map;
  }, [marketTransactions]);

  if (isLoading) return <ByIdSkeleton />;

  if (!market) {
    return (
      <NotFoundBlock
        label={t('notFound')}
        onBack={() => navigate('/')}
        backLabel={t('actions.back', { ns: 'common' })}
      />
    );
  }

  const listState = { fromPath: location.pathname, fromName: market.name };
  const filterState = { fromMarketId: market.id, fromMarketName: market.name };

  return (
    <div className="flex flex-1 flex-col space-y-3 pb-4">
      <Panel className="p-3">
        <DetailHeader name={market.name} subtitle={market.address} image={market.image} />
        <StatRow className="border-border mt-3 border-t pt-2.5">
          <StatCard
            size="sm"
            icon={Package}
            label={t('fields.products')}
            value={market.count.products}
            to="/products"
            state={filterState}
          />
          <StatCard
            size="sm"
            icon={Users}
            label={t('fields.debtors')}
            value={market.count.debtors}
            to="/debtors"
            state={filterState}
          />
          <StatCard
            size="sm"
            icon={ReceiptText}
            label={t('fields.transactions')}
            value={market.count.transactions}
            to="/transactions"
            state={filterState}
          />
        </StatRow>
      </Panel>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="min-w-0 space-y-3 lg:col-span-2">
          <Panel className="p-3">
            <div className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2">
              <InfoItem
                label={t('fields.owner')}
                value={
                  <span className="flex items-center gap-2">
                    <Avatar className="shrink-0">
                      {market.owner.image ? <AvatarImage src={market.owner.image} alt={market.owner.name} /> : null}
                      <AvatarFallback>{market.owner.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <InfoLink to={`/users/${market.ownerId}`} state={listState}>
                      {market.owner.name}
                    </InfoLink>
                  </span>
                }
              />
              <InfoItem label={t('fields.createdAt')} value={formatDate(market.createdAt, true)} />
            </div>
          </Panel>

          <Panel>
            <MarketEntityTabs
              defaultValue="employees"
              tabs={[
                {
                  value: 'employees',
                  label: t('fields.employees'),
                  count: market.users.length,
                  isEmpty: market.users.length === 0,
                  emptyMessage: t('noEmployees'),
                  rows: market.users.map((employee) => (
                    <ListLink
                      key={employee.id}
                      to={employee.role === Role.Seller ? `/sellers/${employee.id}` : `/users/${employee.id}`}
                      state={listState}
                      className="py-1.5">
                      <UserAvatar
                        fullName={employee.name}
                        subInfo={employee.email}
                        imagePath={employee.image ?? undefined}
                      />
                      <Badge variant="secondary" className="text-xs font-normal">
                        {t(`role.${employee.role.toLowerCase()}`)}
                      </Badge>
                    </ListLink>
                  )),
                  viewAll: { to: '/users', state: filterState, label: t('viewAll'), count: market.users.length },
                },
                {
                  value: 'products',
                  label: t('fields.products'),
                  count: market.count.products,
                  isEmpty: marketProducts.length === 0,
                  emptyMessage: t('noProducts'),
                  rows: marketProducts.map((product) => {
                    const sellers = sellersByProduct.get(product.id) ?? [];
                    return (
                      <ListLink key={product.id} to={`/products/${product.id}`} state={listState} className="py-1">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Avatar className="shrink-0">
                            {product.image ? <AvatarImage src={product.image} alt={product.name} /> : null}
                            <AvatarFallback>{product.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{product.name}</p>
                            <p className="text-muted-foreground truncate text-sm">
                              {product.category ? `${product.category.name} · ` : ''}
                              {sellers.length > 0
                                ? `${t('soldCount', { count: product._count.transactionItems })} `
                                : t('soldCount', { count: product._count.transactionItems })}
                            </p>
                          </div>
                        </div>
                        <span className="flex shrink-0 items-center gap-2.5">
                          <SellerAvatars sellers={sellers} />
                          <span className="font-mono text-sm font-semibold">{fmtTJS(product.price)}</span>
                        </span>
                      </ListLink>
                    );
                  }),
                  viewAll: { to: '/products', state: filterState, label: t('viewAll'), count: market.count.products },
                },
                {
                  value: 'debtors',
                  label: t('fields.debtors'),
                  count: market.count.debtors,
                  isEmpty: marketDebtors.length === 0,
                  emptyMessage: t('noDebtors'),
                  rows: marketDebtors.map((debtor) => (
                    <ListLink key={debtor.id} to={`/debtors/${debtor.id}`} state={listState} className="py-1.5">
                      <span className="truncate text-sm font-medium">{debtor.name}</span>
                      <span className="text-muted-foreground text-xs">{debtor.phone}</span>
                    </ListLink>
                  )),
                  viewAll: { to: '/debtors', state: filterState, label: t('viewAll'), count: market.count.debtors },
                },
                {
                  value: 'transactions',
                  label: t('fields.transactions'),
                  count: market.count.transactions,
                  isEmpty: marketTransactions.length === 0,
                  emptyMessage: t('noTransactions'),
                  rows: marketTransactions.map((tx) => (
                    <ListLink key={tx.id} to={`/transactions/${tx.id}`} state={listState} className="py-1.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar className="shrink-0">
                          {tx.createdBy.image ? <AvatarImage src={tx.createdBy.image} alt={tx.createdBy.name} /> : null}
                          <AvatarFallback>{tx.createdBy.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">#{tx.id.slice(0, 8)}</p>
                          <p className="text-muted-foreground text-xs">
                            {t(`type.${tx.type}`, { ns: 'transactions' })}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-semibold">{fmtTJS(tx.totalAmount)}</span>
                    </ListLink>
                  )),
                  viewAll: {
                    to: '/transactions',
                    state: filterState,
                    label: t('viewAll'),
                    count: market.count.transactions,
                  },
                },
              ]}
            />
          </Panel>
        </div>

        <div className="min-w-0 space-y-3">
          <EntityCard
            title={t('fields.owner')}
            fullName={market.owner.name}
            subInfo={market.owner.email}
            imagePath={market.owner.image ?? undefined}
            viewTo={`/users/${market.ownerId}`}
            viewLabel={t('actions.view')}
            viewState={{ fromPath: location.pathname, fromName: t('title') }}
          />

          <QuickActions
            title={t('quickActions')}
            actions={[
              ...(can(Action.MARKETS_EDIT)
                ? [
                    {
                      key: 'edit',
                      icon: Pencil,
                      label: t('actions.edit'),
                      variant: 'outline' as const,
                      onClick: () => editModal.open(market),
                    },
                  ]
                : []),
              {
                key: 'products',
                icon: Package,
                label: t('viewProducts'),
                render: <Link to="/products" state={filterState} />,
              },
              {
                key: 'debtors',
                icon: Users,
                label: t('viewDebtors'),
                render: <Link to="/debtors" state={filterState} />,
              },
              {
                key: 'transactions',
                icon: ReceiptText,
                label: t('viewTransactions'),
                render: <Link to="/transactions" state={filterState} />,
              },
            ]}
          />
        </div>
      </div>

      <EditMarketModal />
    </div>
  );
}
