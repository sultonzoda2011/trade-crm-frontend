import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Lock, Package, Pencil, ReceiptText, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { debtorsApi } from '~/api/debtors';
import { marketsApi } from '~/api/markets';
import { productsApi } from '~/api/products';
import { profileApi } from '~/api/profile';
import { transactionsApi } from '~/api/transactions';
import { Panel } from '~/components/layout/Panel';
import { ChangePasswordModal } from '~/components/modals/ChangePasswordModal';
import { EditProfileModal } from '~/components/modals/EditProfileModal';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { DetailHeader } from '~/components/shared/DetailHeader';
import { InfoItem } from '~/components/shared/InfoItem';
import { InfoLink } from '~/components/shared/InfoLink';
import { ListLink } from '~/components/shared/ListLink';
import { MarketEntityTabs, type EntityTab } from '~/components/shared/MarketEntityTabs';
import { QuickActions } from '~/components/shared/QuickActions';
import { StatCard } from '~/components/shared/StatCard';
import { StatRow } from '~/components/shared/StatRow';
import { TransactionRow } from '~/components/shared/TransactionRow';
import { UserAvatar } from '~/components/shared/UserAvatar';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { ROLE_CONFIG } from '~/config/enumOptions';
import { useCan } from '~/hooks/useCan';
import { getClientUser } from '~/lib/auth-utils';
import { fmtTJS, formatDate } from '~/lib/format';
import { useProfileModals } from '~/routes/(crm)/profile/store';

export default function ProfilePage() {
  const { t } = useTranslation(['profile', 'common']);
  const location = useLocation();
  const editModal = useProfileModals((s) => s.edit);
  const passwordModal = useProfileModals((s) => s.password);

  const { data: response, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.getProfile(),
    staleTime: 30_000,
  });

  const profile = response?.data;
  const user = getClientUser();
  const fromState = { fromPath: location.pathname, fromName: t('title') };

  const { data: marketResponse } = useQuery({
    queryKey: ['profile-market', user?.marketId],
    queryFn: () => marketsApi.getById(user?.marketId!),
    enabled: !!user?.marketId,
    staleTime: 30_000,
  });

  const market = marketResponse?.data;

  const { can } = useCan();

  const canViewProducts = can(Action.PRODUCTS_VIEW);
  const canViewDebtors = can(Action.DEBTORS_VIEW);
  const canViewTransactions = can(Action.TRANSACTIONS_VIEW);
  const [activeTab, setActiveTab] = useState('transactions');

  const { data: productsResponse, isLoading: isProductsLoading } = useQuery({
    queryKey: ['products', 'profile', user?.marketId],
    queryFn: () => productsApi.getAll(1, 20, {}, []),
    enabled: !!user?.marketId && canViewProducts && activeTab === 'products',
    staleTime: 30_000,
  });

  const { data: debtorsResponse, isLoading: isDebtorsLoading } = useQuery({
    queryKey: ['debtors', 'profile', user?.marketId],
    queryFn: () => debtorsApi.getAll(1, 20, {}, []),
    enabled: !!user?.marketId && canViewDebtors && activeTab === 'debtors',
    staleTime: 30_000,
  });

  const { data: txResponse, isLoading: isTxLoading } = useQuery({
    queryKey: ['transactions', 'profile', user?.marketId],
    queryFn: () => transactionsApi.getAll(1, 5, {}, []),
    enabled: !!user?.marketId && canViewTransactions,
    staleTime: 30_000,
  });

  const products = useMemo(() => productsResponse?.data?.data ?? [], [productsResponse]);
  const debtors = useMemo(() => debtorsResponse?.data?.data ?? [], [debtorsResponse]);
  const transactions = useMemo(() => txResponse?.data?.data ?? [], [txResponse]);
  const totalTx = txResponse?.data?.meta?.total ?? market?.count.transactions ?? 0;

  const tabs: EntityTab[] = [];
  if (market && canViewTransactions) {
    tabs.push({
      value: 'transactions',
      label: t('fields.transactions'),
      count: totalTx,
      isLoading: isTxLoading,
      isEmpty: transactions.length === 0,
      emptyMessage: t('noTransactions'),
      rows: transactions.map((tx) => (
        <TransactionRow key={tx.id} tx={tx} t={t} to={`/transactions/${tx.id}`} state={fromState} />
      )),
      viewAll: {
        to: '/transactions',
        state: fromState,
        label: t('viewTransactions'),
        count: totalTx,
      },
    });
  }
  if (market && canViewProducts) {
    tabs.push({
      value: 'products',
      label: t('fields.products'),
      count: productsResponse?.data?.meta?.total ?? market.count.products,
      isLoading: isProductsLoading,
      isEmpty: products.length === 0,
      emptyMessage: t('noProducts'),
      rows: products.map((product) => (
        <ListLink key={product.id} to={`/products/${product.id}`} state={fromState} className="py-1">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar size="lg" className="shrink-0">
              {product.image ? <AvatarImage src={product.image} alt={product.name} /> : null}
              <AvatarFallback>{product.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{product.name}</p>
              {product.category && <p className="text-muted-foreground truncate text-xs">{product.category.name}</p>}
            </div>
          </div>
          <span className="font-mono text-sm font-semibold">{fmtTJS(product.price)}</span>
        </ListLink>
      )),
      viewAll: {
        to: '/products',
        state: fromState,
        label: t('viewProducts'),
        count: productsResponse?.data?.meta?.total ?? market.count.products,
      },
    });
  }
  if (market && canViewDebtors) {
    tabs.push({
      value: 'debtors',
      label: t('fields.debtors'),
      count: debtorsResponse?.data?.meta?.total ?? market.count.debtors,
      isLoading: isDebtorsLoading,
      isEmpty: debtors.length === 0,
      emptyMessage: t('noDebtors'),
      rows: debtors.map((debtor) => (
        <ListLink key={debtor.id} to={`/debtors/${debtor.id}`} state={fromState} className="py-1.5">
          <span className="truncate text-sm font-medium">{debtor.name}</span>
          <span className="text-muted-foreground text-xs">{debtor.phone}</span>
        </ListLink>
      )),
      viewAll: {
        to: '/debtors',
        state: fromState,
        label: t('viewDebtors'),
        count: debtorsResponse?.data?.meta?.total ?? market.count.debtors,
      },
    });
  }

  if (isLoading) return <ByIdSkeleton />;

  if (!profile) {
    return (
      <div className="flex h-100 flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">{t('loadError')}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t('actions.retry')}
        </Button>
      </div>
    );
  }

  const roleBadge = (
    <Badge variant="outline" className={ROLE_CONFIG[profile.role]?.className}>
      {ROLE_CONFIG[profile.role] ? ROLE_CONFIG[profile.role].label(t) : profile.role}
    </Badge>
  );

  return (
    <div className="flex flex-1 flex-col space-y-6 pb-8">
      <BreadCrumbs
        items={[{ label: t('navigation.dashboard', { ns: 'common' }), link: '/dashboard' }, { label: t('title') }]}
      />

      <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Panel className="p-6">
            <DetailHeader name={profile.name} subtitle={profile.email} image={profile.image} badges={roleBadge} />
          </Panel>

          <Panel title={t('sections.profile')}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <InfoItem label={t('fields.role')} value={roleBadge} />
              <InfoItem label={t('fields.email')} value={profile.email} />
              <InfoItem label={t('fields.createdAt')} value={formatDate(profile.createdAt, true)} />
            </div>
          </Panel>

          {market && (
            <Panel title={t('sections.market')}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <InfoItem
                  label={t('fields.market')}
                  value={
                    <span className="flex items-center gap-2">
                      <Avatar size="sm" className="shrink-0">
                        {market.image ? <AvatarImage src={market.image} alt={market.name} /> : null}
                        <AvatarFallback>{market.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <InfoLink to={`/markets/${market.id}`} state={fromState}>
                        {market.name}
                      </InfoLink>
                    </span>
                  }
                />
                <InfoItem label={t('fields.address')} value={market.address} />
                <InfoItem label={t('fields.createdAt')} value={formatDate(market.createdAt, true)} />
                <InfoItem label={t('fields.updatedAt')} value={formatDate(market.updatedAt, true)} />
              </div>
            </Panel>
          )}
          {market && tabs.length > 0 && (
            <Panel>
              <MarketEntityTabs value={activeTab} onValueChange={setActiveTab} tabs={tabs} />
            </Panel>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          {market && (
            <Panel title={t('sections.market')}>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 shrink-0 rounded-lg">
                    {market.image ? <AvatarImage src={market.image} alt={market.name} /> : null}
                    <AvatarFallback className="bg-muted rounded-lg">
                      {market.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{market.name}</p>
                    <p className="text-muted-foreground truncate text-xs">{market.address}</p>
                  </div>
                </div>
                <UserAvatar
                  fullName={market.owner.name}
                  subInfo={market.owner.email}
                  imagePath={market.owner.image ?? undefined}
                />
                <StatRow>
                  <StatCard
                    size="sm"
                    icon={Package}
                    label={t('fields.products')}
                    value={market.count.products}
                    to="/products"
                    state={fromState}
                  />
                  <StatCard
                    size="sm"
                    icon={Users}
                    label={t('fields.debtors')}
                    value={market.count.debtors}
                    to="/debtors"
                    state={fromState}
                  />
                  <StatCard
                    size="sm"
                    icon={ReceiptText}
                    label={t('fields.transactions')}
                    value={market.count.transactions}
                    to="/transactions"
                    state={fromState}
                  />
                </StatRow>
                <Button
                  variant="outline"
                  className="h-9 w-full justify-between gap-2"
                  size="sm"
                  render={<Link to={`/markets/${market.id}`} state={fromState} />}>
                  <span className="truncate">{t('goToMarket')}</span>
                  <ArrowUpRight className="size-3.5 shrink-0" />
                </Button>
              </div>
            </Panel>
          )}

          <QuickActions
            title={t('quickActions')}
            actions={[
              { icon: Pencil, label: t('editProfile'), variant: 'outline', onClick: () => editModal.open(profile) },
              { icon: Lock, label: t('sections.password'), onClick: () => passwordModal.open() },
            ]}
          />
        </div>
      </div>

      <EditProfileModal />
      <ChangePasswordModal />
    </div>
  );
}
