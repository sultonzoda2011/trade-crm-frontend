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
import { EntityCard } from '~/components/shared/EntityCard';
import { InfoItem } from '~/components/shared/InfoItem';
import { InfoLink } from '~/components/shared/InfoLink';
import { ListLink } from '~/components/shared/ListLink';
import { MarketEntityTabs } from '~/components/shared/MarketEntityTabs';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import { QuickActions } from '~/components/shared/QuickActions';
import { StatCard } from '~/components/shared/StatCard';
import { StatRow } from '~/components/shared/StatRow';
import { TransactionRow } from '~/components/shared/TransactionRow';
import { UserAvatar } from '~/components/shared/UserAvatar';

import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';

import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { fmtTJS, formatDate } from '~/lib/format';
import { useMarketsModals } from '~/routes/(crm)/markets/store';
import { Role } from '~/types/common';
import type { UserInfo } from '~/types/users';

function SellerAvatars({ sellers }: { sellers: UserInfo[] }) {
  if (sellers.length === 0) {
    return null;
  }

  const visibleSellers = sellers.slice(0, 3);
  const remainingCount = sellers.length - visibleSellers.length;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <AvatarGroup data-size="sm">
            {visibleSellers.map((seller) => (
              <Avatar key={seller.id} size="sm">
                {seller.image && <AvatarImage src={seller.image} alt={seller.name} />}
                <AvatarFallback>{seller.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            ))}

            {remainingCount > 0 && <AvatarGroupCount>+{remainingCount}</AvatarGroupCount>}
          </AvatarGroup>
        }
      />

      <TooltipContent side="top">{sellers.map((seller) => seller.name).join(', ')}</TooltipContent>
    </Tooltip>
  );
}

export default function MarketDetailPage() {
  const { t } = useTranslation(['markets', 'common', 'transactions']);
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();
  const location = useLocation();

  const { can, user } = useCan();
  const editModal = useMarketsModals((state) => state.edit);

  const { data: marketResponse, isLoading } = useQuery({
    queryKey: ['market', id],
    queryFn: () => marketsApi.getById(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });

  const market = marketResponse?.data;

  const isOwnMarket = Boolean(user?.marketId) && user?.marketId === id;

  const { data: productsResponse } = useQuery({
    queryKey: ['products', 'market-preview', id],
    queryFn: () => productsApi.getAll(1, 100),
    enabled: Boolean(id) && isOwnMarket,
    staleTime: 30_000,
  });

  const { data: debtorsResponse } = useQuery({
    queryKey: ['debtors', 'market-preview', id],
    queryFn: () => debtorsApi.getAll(1, 100),
    enabled: Boolean(id) && isOwnMarket,
    staleTime: 30_000,
  });

  const { data: transactionsResponse } = useQuery({
    queryKey: ['transactions', 'market-preview', id],
    queryFn: () => transactionsApi.getAll(1, 100),
    enabled: Boolean(id) && isOwnMarket,
    staleTime: 30_000,
  });

  const marketProducts = productsResponse?.data?.data ?? [];
  const marketDebtors = debtorsResponse?.data?.data ?? [];
  const marketTransactions = transactionsResponse?.data?.data ?? [];

  const sellersByProduct = useMemo(() => {
    const sellersMap = new Map<string, UserInfo[]>();

    for (const transaction of marketTransactions) {
      for (const item of transaction.items) {
        const sellers = sellersMap.get(item.productId) ?? [];

        const alreadyExists = sellers.some((seller) => seller.id === transaction.createdBy.id);

        if (!alreadyExists) {
          sellers.push(transaction.createdBy);
          sellersMap.set(item.productId, sellers);
        }
      }
    }

    return sellersMap;
  }, [marketTransactions]);

  if (isLoading) {
    return <ByIdSkeleton />;
  }

  if (!market) {
    return (
      <NotFoundBlock
        label={t('notFound')}
        onBack={() => navigate('/markets')}
        backLabel={t('actions.back', { ns: 'common' })}
      />
    );
  }

  const listState = {
    fromPath: location.pathname,
    fromName: market.name,
  };

  const filterState = {
    fromMarketId: market.id,
    fromMarketName: market.name,
  };

  const employeeTab = {
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
        className="py-2">
        <UserAvatar fullName={employee.name} subInfo={employee.email} imagePath={employee.image ?? undefined} />

        <Badge variant="secondary" className="text-xs font-normal">
          {t(`role.${employee.role.toLowerCase()}`)}
        </Badge>
      </ListLink>
    )),

    viewAll: {
      to: '/users',
      state: listState,
      label: t('viewAll'),
      count: market.users.length,
    },
  };

  const productsTab = {
    value: 'products',
    label: t('fields.products'),
    count: market.count.products,
    badgeClassName: isOwnMarket ? 'bg-primary/10 text-primary' : undefined,
    isEmpty: marketProducts.length === 0,
    emptyMessage: t('noProducts'),

    rows: marketProducts.map((product) => {
      const sellers = sellersByProduct.get(product.id) ?? [];

      return (
        <ListLink key={product.id} to={`/products/${product.id}`} state={listState} className="py-1">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar className="shrink-0">
              {product.image && <AvatarImage src={product.image} alt={product.name} />}

              <AvatarFallback>{product.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{product.name}</p>

              <p className="text-muted-foreground truncate text-sm">
                {product.category?.name && `${product.category.name} · `}
                {t('soldCount', {
                  count: product._count.transactionItems,
                })}
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

    viewAll: {
      to: '/products',
      state: filterState,
      label: t('viewAll'),
      count: market.count.products,
    },
  };

  const debtorsTab = {
    value: 'debtors',
    label: t('fields.debtors'),
    count: market.count.debtors,
    badgeClassName: 'bg-warning/15 text-warning',
    isEmpty: marketDebtors.length === 0,
    emptyMessage: t('noDebtors'),

    rows: marketDebtors.map((debtor) => (
      <ListLink key={debtor.id} to={`/debtors/${debtor.id}`} state={listState} className="py-1.5">
        <span className="truncate text-sm font-medium">{debtor.name}</span>

        <span className="text-muted-foreground text-xs">{debtor.phone}</span>
      </ListLink>
    )),

    viewAll: {
      to: '/debtors',
      state: filterState,
      label: t('viewAll'),
      count: market.count.debtors,
    },
  };

  const transactionsTab = {
    value: 'transactions',
    label: t('fields.transactions'),
    count: market.count.transactions,
    badgeClassName: 'bg-chart-5/15 text-chart-5',
    isEmpty: marketTransactions.length === 0,
    emptyMessage: t('noTransactions'),

    rows: marketTransactions.map((transaction) => (
      <TransactionRow
        key={transaction.id}
        tx={transaction}
        t={t}
        to={`/transactions/${transaction.id}`}
        state={listState}
      />
    )),

    viewAll: {
      to: '/transactions',
      state: filterState,
      label: t('viewAll'),
      count: market.count.transactions,
    },
  };

  const tabs = isOwnMarket ? [employeeTab, productsTab, debtorsTab, transactionsTab] : [employeeTab];

  const quickActions = [
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
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4 pb-6">
      <Panel className="p-4">
        <DetailHeader name={market.name} subtitle={market.address} image={market.image} />

        <StatRow className="border-border mt-3 border-t pt-3">
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Panel className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
            <InfoItem
              label={t('fields.name')}
              value={
                <div className="flex items-center gap-2">
                  <Avatar size="sm" className="shrink-0">
                    {market.image && <AvatarImage src={market.image} alt={market.name} />}

                    <AvatarFallback>{market.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>

                  <span className="truncate">{market.name}</span>
                </div>
              }
            />

            <InfoItem label={t('fields.address')} value={market.address} />

            <InfoItem
              label={t('fields.owner')}
              value={
                <div className="flex items-center gap-2">
                  <Avatar size="sm" className="shrink-0">
                    {market.owner.image && <AvatarImage src={market.owner.image} alt={market.owner.name} />}

                    <AvatarFallback>{market.owner.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>

                  <InfoLink to={`/users/${market.ownerId}`} state={listState}>
                    {market.owner.name}
                  </InfoLink>
                </div>
              }
            />

            <InfoItem label={t('fields.createdAt')} value={formatDate(market.createdAt, true)} />

            <InfoItem label={t('fields.updatedAt')} value={formatDate(market.updatedAt, true)} />
          </Panel>

          <Panel>
            <MarketEntityTabs
              defaultValue="employees"
              maxHeightClass="max-h-80"
              emptyClassName="py-10"
              contentClassName="mt-3"
              viewAllClassName="mt-2 flex justify-end border-t pt-2"
              tabs={tabs}
            />
          </Panel>
        </div>

        <div className="min-w-0 space-y-4">
          <EntityCard
            title={t('fields.owner')}
            fullName={market.owner.name}
            subInfo={market.owner.email}
            imagePath={market.owner.image ?? undefined}
            viewTo={`/users/${market.ownerId}`}
            viewLabel={t('actions.view')}
            viewState={{
              fromPath: location.pathname,
              fromName: t('title'),
            }}
          />

          <QuickActions title={t('quickActions')} actions={quickActions} />
        </div>
      </div>

      <EditMarketModal />
    </div>
  );
}
