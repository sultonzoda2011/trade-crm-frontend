import { useQuery } from '@tanstack/react-query';
import { Package, Pencil, ReceiptText, Users } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
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
import { Badge } from '~/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { fmtTJS, formatDate } from '~/lib/format';
import { useMarketsModals } from '../store';

export default function MarketDetailPage() {
  const { t } = useTranslation(['markets', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useCan();
  const editModal = useMarketsModals((s) => s.edit);

  const { data: response, isLoading } = useQuery({
    queryKey: ['market', id],
    queryFn: () => marketsApi.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const market = response?.data;

  const { data: marketProductsResponse } = useQuery({
    queryKey: ['market-products-preview'],
    queryFn: () => productsApi.getAll(1, 100),
    enabled: !!id,
    staleTime: 30_000,
  });

  const { data: marketDebtorsResponse } = useQuery({
    queryKey: ['market-debtors-preview'],
    queryFn: () => debtorsApi.getAll(1, 100),
    enabled: !!id,
    staleTime: 30_000,
  });

  const { data: marketTransactionsResponse } = useQuery({
    queryKey: ['market-transactions-preview'],
    queryFn: () => transactionsApi.getAll(1, 100),
    enabled: !!id,
    staleTime: 30_000,
  });

  const marketProducts = useMemo(() => marketProductsResponse?.data?.data ?? [], [marketProductsResponse]);
  const marketDebtors = useMemo(() => marketDebtorsResponse?.data?.data ?? [], [marketDebtorsResponse]);
  const marketTransactions = useMemo(() => marketTransactionsResponse?.data?.data ?? [], [marketTransactionsResponse]);

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
    <div className="flex flex-1 flex-col space-y-4 pb-6">
      <Panel className="p-4">
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
        <div className="border-border mt-3 grid grid-cols-3 gap-2 border-t pt-3">
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel>
            <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
              <InfoItem
                label={t('fields.name')}
                value={
                  <span className="flex items-center gap-2">
                    <Avatar size="sm" className="shrink-0">
                      {market.image ? <AvatarImage src={market.image} alt={market.name} /> : null}
                      <AvatarFallback>{market.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{market.name}</span>
                  </span>
                }
              />
              <InfoItem label={t('fields.address')} value={market.address} />
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
              <InfoItem label={t('fields.updatedAt')} value={formatDate(market.updatedAt, true)} />
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

              <div className="mt-3">
                <TabsContent value="employees">
                  {market.users.length === 0 ? (
                    <EmptyState
                      className="py-10"
                      message={t('noEmployees', { defaultValue: 'Пока нет сотрудников' })}
                    />
                  ) : (
                    <div className="scrollbar-thin max-h-80 overflow-y-auto">
                      {market.users.map((employee) => (
                        <ListLink
                          key={employee.id}
                          to={employee.role === 'SELLER' ? `/sellers/${employee.id}` : `/users/${employee.id}`}
                          state={listState}
                          className="py-2">
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
                    <div className="border-border mt-2 flex justify-end border-t pt-2">
                      <PanelViewAll to="/users" state={filterState} label={t('viewAll')} count={market.users.length} />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="products">
                  {marketProducts.length === 0 ? (
                    <EmptyState className="py-10" message={t('noProducts', { defaultValue: 'Пока нет товаров' })} />
                  ) : (
                    <div className="divide-border scrollbar-thin max-h-80 divide-y overflow-y-auto">
                      {marketProducts.map((product) => (
                        <ListLink key={product.id} to={`/products/${product.id}`} state={listState} className="py-1.5">
                          <span className="truncate text-sm font-medium">{product.name}</span>
                          <span className="font-mono text-sm font-semibold">{fmtTJS(product.price)}</span>
                        </ListLink>
                      ))}
                    </div>
                  )}
                  {marketProducts.length > 0 && (
                    <div className="border-border mt-2 flex justify-end border-t pt-2">
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
                    <EmptyState className="py-10" message={t('noDebtors', { defaultValue: 'Пока нет должников' })} />
                  ) : (
                    <div className="divide-border scrollbar-thin max-h-80 divide-y overflow-y-auto">
                      {marketDebtors.map((debtor) => (
                        <ListLink key={debtor.id} to={`/debtors/${debtor.id}`} state={listState} className="py-1.5">
                          <span className="truncate text-sm font-medium">{debtor.name}</span>
                          <span className="text-muted-foreground text-xs">{debtor.phone}</span>
                        </ListLink>
                      ))}
                    </div>
                  )}
                  {marketDebtors.length > 0 && (
                    <div className="border-border mt-2 flex justify-end border-t pt-2">
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
                      className="py-10"
                      message={t('noTransactions', { defaultValue: 'Пока нет транзакций' })}
                    />
                  ) : (
                    <div className="divide-border scrollbar-thin max-h-80 divide-y overflow-y-auto">
                      {marketTransactions.map((tx) => (
                        <ListLink key={tx.id} to={`/transactions/${tx.id}`} state={listState} className="py-1.5">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">#{tx.id.slice(0, 8)}</p>
                            <p className="text-muted-foreground text-xs">
                              {tx.type === 'DEBT'
                                ? t('type.DEBT', { ns: 'transactions' })
                                : t('type.SALE', { ns: 'transactions' })}
                            </p>
                          </div>
                          <span className="font-mono text-sm font-semibold">{fmtTJS(tx.totalAmount)}</span>
                        </ListLink>
                      ))}
                    </div>
                  )}
                  {marketTransactions.length > 0 && (
                    <div className="border-border mt-2 flex justify-end border-t pt-2">
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

        <div className="space-y-4">
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
                      icon: Pencil,
                      label: t('actions.edit'),
                      variant: 'outline' as const,
                      onClick: () => editModal.open(market),
                    },
                  ]
                : []),
              {
                icon: Package,
                label: t('viewProducts'),
                render: <Link to="/products" state={filterState} />,
              },
              {
                icon: Users,
                label: t('viewDebtors'),
                render: <Link to="/debtors" state={filterState} />,
              },
              {
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
