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
import { EmptyState } from '~/components/shared/EmptyState';
import { EntityCard } from '~/components/shared/EntityCard';
import { InfoItem } from '~/components/shared/InfoItem';
import { InfoLink } from '~/components/shared/InfoLink';
import { ListLink } from '~/components/shared/ListLink';
import { PanelViewAll } from '~/components/shared/PanelViewAll';
import { QuickActions } from '~/components/shared/QuickActions';
import { StatCard } from '~/components/shared/StatCard';
import { UserAvatar } from '~/components/shared/UserAvatar';
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { getUserFromToken } from '~/lib/auth-utils';
import { fmtTJS, formatDate } from '~/lib/format';
import { useMyMarketModals } from './store';
import type { UserInfo } from '~/types/users';
import type { Product } from '~/types/products';
import type { Debtor } from '~/types/debtors';
import type { Transaction } from '~/types/transactions';

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
  const { marketId: id } = getUserFromToken() || {};
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useCan();
  const editModal = useMyMarketModals((s) => s.edit);

  const { data: response, isLoading } = useQuery({
    queryKey: ['market', id],
    queryFn: () => marketsApi.getById(id!),
    enabled: !!id,
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
      <div className="flex h-100 flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">{t('notFound')}</p>
        <Button variant="outline" onClick={() => navigate('/markets')}>
          {t('actions.back', { ns: 'common' })}
        </Button>
      </div>
    );
  }

  const listState = { fromPath: location.pathname, fromName: market.name };
  const filterState = { fromMarketId: market.id, fromMarketName: market.name };

  return (
    <div className="flex flex-1 flex-col space-y-3 pb-4">
      <Panel className="p-3">
        <DetailHeader
          name={market.name}
          subtitle={market.address}
          image={market.image}
          actions={
            can(Action.MARKETS_EDIT) ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => editModal.open(market)}>
                      <Pencil className="size-3.5" />
                      <span className="hidden sm:inline">{t('actions.edit')}</span>
                    </Button>
                  }
                />
                <TooltipContent side="bottom">{t('actions.edit')}</TooltipContent>
              </Tooltip>
            ) : undefined
          }
        />
        <div className="border-border mt-3 grid grid-cols-3 gap-2 border-t pt-2.5">
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
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="min-w-0 space-y-3 lg:col-span-2">
          <Panel className="p-3">
            <div className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2">
              <InfoItem
                label={t('fields.owner')}
                value={
                  <span className="flex items-center gap-2">
                    <Avatar size="sm" className="shrink-0">
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
            <Tabs defaultValue="employees">
              <TabsList className="w-full">
                <TabsTrigger value="employees" className="flex-1">
                  {t('fields.employees')}
                  <Badge variant="secondary" className="text-xs font-normal">
                    {market.users.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="products" className="flex-1">
                  {t('fields.products')}
                  <Badge variant="secondary" className="text-xs font-normal">
                    {market.count.products}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="debtors" className="flex-1">
                  {t('fields.debtors')}
                  <Badge variant="secondary" className="text-xs font-normal">
                    {market.count.debtors}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="transactions" className="flex-1">
                  {t('fields.transactions')}
                  <Badge variant="secondary" className="text-xs font-normal">
                    {market.count.transactions}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <div className="mt-2.5">
                <TabsContent value="employees">
                  {market.users.length === 0 ? (
                    <EmptyState className="py-6" message={t('noEmployees', { defaultValue: 'Пока нет сотрудников' })} />
                  ) : (
                    <div className="scrollbar-thin max-h-64 overflow-y-auto">
                      {market.users.map((employee) => (
                        <ListLink
                          key={employee.id}
                          to={employee.role === 'SELLER' ? `/sellers/${employee.id}` : `/users/${employee.id}`}
                          state={listState}
                          className="py-1.5">
                          <UserAvatar
                            fullName={employee.name}
                            subInfo={employee.email}
                            imagePath={employee.image ?? undefined}
                          />
                          <Badge variant="secondary" className="text-xs font-normal">
                            {t(`role.${employee.role.toLocaleLowerCase()}`)}
                          </Badge>
                        </ListLink>
                      ))}
                    </div>
                  )}
                  {market.users.length > 0 && (
                    <div className="border-border mt-1.5 flex justify-end border-t pt-1.5">
                      <PanelViewAll to="/users" state={filterState} label={t('viewAll')} count={market.users.length} />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="products">
                  {marketProducts.length === 0 ? (
                    <EmptyState className="py-6" message={t('noProducts', { defaultValue: 'Пока нет товаров' })} />
                  ) : (
                    <div className="scrollbar-thin divide-border max-h-64 divide-y overflow-y-auto">
                      {marketProducts.map((product) => {
                        const sellers = sellersByProduct.get(product.id) ?? [];
                        return (
                          <ListLink
                            key={product.id}
                            to={`/products/${product.id}`}
                            state={listState}
                            className="py-1.5">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <Avatar size="sm" className="shrink-0">
                                {product.image ? <AvatarImage src={product.image} alt={product.name} /> : null}
                                <AvatarFallback>{product.name.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{product.name}</p>
                                <p className="text-muted-foreground truncate text-xs">
                                  {sellers.length > 0
                                    ? `${t('soldCount', { count: product._count.transactionItems })} · ${sellers.map((seller) => seller.name).join(', ')}`
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
                      })}
                    </div>
                  )}
                  {marketProducts.length > 0 && (
                    <div className="border-border mt-1.5 flex justify-end border-t pt-1.5">
                      <PanelViewAll
                        to="/products"
                        state={filterState}
                        label={t('viewAll')}
                        count={market.count.products}
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="debtors">
                  {marketDebtors.length === 0 ? (
                    <EmptyState className="py-6" message={t('noDebtors', { defaultValue: 'Пока нет должников' })} />
                  ) : (
                    <div className="scrollbar-thin divide-border max-h-64 divide-y overflow-y-auto">
                      {marketDebtors.map((debtor) => (
                        <ListLink key={debtor.id} to={`/debtors/${debtor.id}`} state={listState} className="py-1.5">
                          <span className="truncate text-sm font-medium">{debtor.name}</span>
                          <span className="text-muted-foreground text-xs">{debtor.phone}</span>
                        </ListLink>
                      ))}
                    </div>
                  )}
                  {marketDebtors.length > 0 && (
                    <div className="border-border mt-1.5 flex justify-end border-t pt-1.5">
                      <PanelViewAll
                        to="/debtors"
                        state={filterState}
                        label={t('viewAll')}
                        count={market.count.debtors}
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="transactions">
                  {marketTransactions.length === 0 ? (
                    <EmptyState
                      className="py-6"
                      message={t('noTransactions', { defaultValue: 'Пока нет транзакций' })}
                    />
                  ) : (
                    <div className="scrollbar-thin divide-border max-h-64 divide-y overflow-y-auto">
                      {marketTransactions.map((tx) => (
                        <ListLink key={tx.id} to={`/transactions/${tx.id}`} state={listState} className="py-1.5">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <Avatar size="sm" className="shrink-0">
                              {tx.createdBy.image ? (
                                <AvatarImage src={tx.createdBy.image} alt={tx.createdBy.name} />
                              ) : null}
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
                      ))}
                    </div>
                  )}
                  {marketTransactions.length > 0 && (
                    <div className="border-border mt-1.5 flex justify-end border-t pt-1.5">
                      <PanelViewAll
                        to="/transactions"
                        state={filterState}
                        label={t('viewAll')}
                        count={market.count.transactions}
                      />
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
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
