import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, Package, Pencil, ReceiptText, Users } from 'lucide-react';
import { useMemo, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { debtorsApi } from '~/api/debtors';
import { marketsApi } from '~/api/markets';
import { productsApi } from '~/api/products';
import { transactionsApi } from '~/api/transactions';
import { Panel } from '~/components/layout/Panel';
import { EditMarketModal } from '~/components/modals/EditMarketModal';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { InfoItem } from '~/components/shared/InfoItem';
import { UserAvatar } from '~/components/shared/UserAvatar';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { fmtTJS, formatDate } from '~/lib/format';
import { useMarketsModals } from '../store';

interface StatCardProps extends ComponentProps<typeof Link> {
  icon: LucideIcon;
  label: string;
  value: number;
}

function StatCard({ icon: Icon, label, value, ...linkProps }: StatCardProps) {
  return (
    <Link
      {...linkProps}
      className="bg-muted/50 hover:bg-muted/80 flex flex-col items-center gap-1.5 rounded-xl p-4 transition-colors">
      <Icon className="text-muted-foreground size-4" />
      <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">{label}</span>
      <Badge variant="secondary" className="font-mono text-base">
        {value}
      </Badge>
    </Link>
  );
}

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
    queryFn: () => productsApi.getAll(1, 5, {}, []),
    staleTime: 30_000,
  });

  const { data: marketDebtorsResponse } = useQuery({
    queryKey: ['market-debtors-preview'],
    queryFn: () => debtorsApi.getAll(1, 5, {}, []),
    staleTime: 30_000,
  });

  const { data: marketTransactionsResponse } = useQuery({
    queryKey: ['market-transactions-preview'],
    queryFn: () => transactionsApi.getAll(1, 5, {}, []),
    staleTime: 30_000,
  });

  const marketProducts = useMemo(() => marketProductsResponse?.data?.data ?? [], [marketProductsResponse]);
  const marketDebtors = useMemo(() => marketDebtorsResponse?.data?.data ?? [], [marketDebtorsResponse]);
  const marketTransactions = useMemo(() => marketTransactionsResponse?.data?.data ?? [], [marketTransactionsResponse]);

  if (isLoading) return <ByIdSkeleton />;

  if (!market) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">{t('notFound')}</p>
        <Button variant="outline" onClick={() => navigate('/markets')}>
          {t('actions.back', { ns: 'common' })}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col space-y-6 pb-8">
      <Panel className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Avatar className="size-16 rounded-xl">
              <AvatarImage src={market.image ? market.image : undefined} className="object-cover" />
              <AvatarFallback className="bg-muted rounded-xl text-2xl font-semibold">
                {market.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-bold tracking-tight">{market.name}</h1>
              <p className="text-muted-foreground text-sm">{market.address}</p>
            </div>
          </div>
          {can(Action.MARKETS_EDIT) && (
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
          )}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InfoItem label={t('fields.name')} value={market.name} />
              <InfoItem label={t('fields.address')} value={market.address} />
              <InfoItem
                label={t('fields.owner')}
                value={
                  <Link
                    to={`/users/${market.ownerId}`}
                    className="group text-primary inline-flex items-center gap-1 text-sm font-semibold hover:underline">
                    {market.owner.name}
                    <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                }
              />
              <InfoItem label={t('fields.createdAt')} value={formatDate(market.createdAt, true)} />
              <InfoItem label={t('fields.updatedAt')} value={formatDate(market.updatedAt, true)} />
            </div>
          </Panel>

          <Panel title={t('statistics')}>
            <div className="grid grid-cols-3 gap-4">
              <StatCard
                icon={Package}
                label={t('fields.products')}
                value={market.count.products}
                to="/products"
                state={{ fromMarketId: market.id, fromMarketName: market.name }}
              />
              <StatCard
                icon={Users}
                label={t('fields.debtors')}
                value={market.count.debtors}
                to="/debtors"
                state={{ fromMarketId: market.id, fromMarketName: market.name }}
              />
              <StatCard
                icon={ReceiptText}
                label={t('fields.transactions')}
                value={market.count.transactions}
                to="/transactions"
                state={{ fromMarketId: market.id, fromMarketName: market.name }}
              />
            </div>
          </Panel>

          <Panel
            title={t('fields.employees')}
            actions={
              market.users.length > 0 ? (
                <Link
                  to="/users"
                  state={{ fromMarketId: market.id, fromMarketName: market.name }}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium transition-colors">
                  {t('viewAll')} ({market.users.length})
                  <ArrowUpRight className="size-3" />
                </Link>
              ) : undefined
            }>
            {market.users.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                {t('noEmployees', { defaultValue: 'Пока нет сотрудников' })}
              </p>
            ) : (
              <div className="divide-border divide-y">
                {market.users.map((employee) => (
                  <Link
                    key={employee.id}
                    to={employee.role === 'SELLER' ? `/sellers/${employee.id}` : `/users/${employee.id}`}
                    state={{ fromPath: location.pathname, fromName: market.name }}
                    className="hover:bg-muted/40 -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-3 transition-colors">
                    <UserAvatar fullName={employee.name} subInfo={employee.email} />
                    <Badge variant="secondary" className="text-xs font-normal">
                      {t(`role.${employee.role.toLocaleLowerCase()}`)}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          {marketProducts.length > 0 && (
            <Panel
              title={t('fields.products')}
              actions={
                <Link
                  to="/products"
                  state={{ fromMarketId: market.id, fromMarketName: market.name }}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium transition-colors">
                  {t('viewAll')} ({market.count.products})
                  <ArrowUpRight className="size-3" />
                </Link>
              }>
              <div className="divide-border divide-y">
                {marketProducts.slice(0, 5).map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    state={{ fromPath: location.pathname, fromName: market.name }}
                    className="hover:bg-muted/40 -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2.5 transition-colors">
                    <span className="truncate text-sm font-medium">{product.name}</span>
                    <span className="font-mono text-sm font-semibold">{fmtTJS(product.price)}</span>
                  </Link>
                ))}
              </div>
            </Panel>
          )}

          {marketDebtors.length > 0 && (
            <Panel
              title={t('fields.debtors')}
              actions={
                <Link
                  to="/debtors"
                  state={{ fromMarketId: market.id, fromMarketName: market.name }}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium transition-colors">
                  {t('viewAll')} ({market.count.debtors})
                  <ArrowUpRight className="size-3" />
                </Link>
              }>
              <div className="divide-border divide-y">
                {marketDebtors.slice(0, 5).map((debtor) => (
                  <Link
                    key={debtor.id}
                    to={`/debtors/${debtor.id}`}
                    state={{ fromPath: location.pathname, fromName: market.name }}
                    className="hover:bg-muted/40 -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2.5 transition-colors">
                    <span className="truncate text-sm font-medium">{debtor.name}</span>
                    <span className="text-muted-foreground text-xs">{debtor.phone}</span>
                  </Link>
                ))}
              </div>
            </Panel>
          )}

          {marketTransactions.length > 0 && (
            <Panel
              title={t('fields.transactions')}
              actions={
                <Link
                  to="/transactions"
                  state={{ fromMarketId: market.id, fromMarketName: market.name }}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium transition-colors">
                  {t('viewAll')} ({market.count.transactions})
                  <ArrowUpRight className="size-3" />
                </Link>
              }>
              <div className="divide-border divide-y">
                {marketTransactions.slice(0, 5).map((tx) => (
                  <Link
                    key={tx.id}
                    to={`/transactions/${tx.id}`}
                    state={{ fromPath: location.pathname, fromName: market.name }}
                    className="hover:bg-muted/40 -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2.5 transition-colors">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">#{tx.id.slice(0, 8)}</p>
                      <p className="text-muted-foreground text-xs">
                        {tx.type === 'DEBT'
                          ? t('type.DEBT', { ns: 'transactions' })
                          : t('type.SALE', { ns: 'transactions' })}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-semibold">{fmtTJS(tx.totalAmount)}</span>
                  </Link>
                ))}
              </div>
            </Panel>
          )}
        </div>

        <div className="space-y-6">
          <Panel title={t('fields.owner')}>
            <div className="space-y-4">
              <UserAvatar fullName={market.owner.name} subInfo={market.owner.email} />
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                render={
                  <Link to={`/users/${market.ownerId}`} state={{ fromPath: location.pathname, fromName: t('title') }} />
                }>
                {t('actions.view')}
                <ArrowUpRight className="size-3.5" />
              </Button>
            </div>
          </Panel>

          <Panel title={t('quickActions')}>
            <div className="space-y-2">
              {can(Action.MARKETS_EDIT) && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  size="sm"
                  onClick={() => editModal.open(market)}>
                  <Pencil className="size-3.5" />
                  {t('actions.edit')}
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                size="sm"
                render={<Link to="/products" state={{ fromMarketId: market.id, fromMarketName: market.name }} />}>
                <Package className="size-3.5" />
                {t('viewProducts')}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                size="sm"
                render={<Link to="/debtors" state={{ fromMarketId: market.id, fromMarketName: market.name }} />}>
                <Users className="size-3.5" />
                {t('viewDebtors')}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                size="sm"
                render={<Link to="/transactions" state={{ fromMarketId: market.id, fromMarketName: market.name }} />}>
                <ReceiptText className="size-3.5" />
                {t('viewTransactions')}
              </Button>
            </div>
          </Panel>
        </div>
      </div>

      <EditMarketModal />
    </div>
  );
}
