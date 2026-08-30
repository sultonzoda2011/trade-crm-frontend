import { HandCoins, Package, Pencil, ReceiptText } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';

import { Panel } from '~/components/layout/Panel';
import { SellerAvatars } from '~/components/markets/SellerAvatars';
import { DetailHeader } from '~/components/shared/DetailHeader';
import { EntityCard } from '~/components/shared/EntityCard';
import { InfoItem } from '~/components/shared/InfoItem';
import { InfoLink } from '~/components/shared/InfoLink';
import { ListLink } from '~/components/shared/ListLink';
import { MarketEntityTabs, type EntityTab } from '~/components/shared/MarketEntityTabs';
import { QuickActions, type QuickActionItem } from '~/components/shared/QuickActions';
import { StatCard } from '~/components/shared/StatCard';
import { StatRow } from '~/components/shared/StatRow';
import { TransactionRow } from '~/components/shared/TransactionRow';
import { UserAvatar } from '~/components/shared/UserAvatar';

import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';

import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { getClientUser } from '~/lib/auth-utils';
import { fmtTJS, formatDate } from '~/lib/format';
import { useMarketsModals } from '~/routes/(crm)/markets/store';
import { Role } from '~/types/common';
import type { Debtor } from '~/types/debtors';
import type { Market } from '~/types/markets';
import type { Product } from '~/types/products';
import type { Transaction } from '~/types/transactions';
import type { UserInfo } from '~/types/users';

/**
 * Сколько записей показывает превью-вкладка, дальше — ссылка «Все».
 *
 * Экспортируется, потому что запросы живут в роутах, а лимит должен совпадать
 * с тем, по которому вкладка решает, показывать ли «Все».
 */
export const MARKET_PREVIEW_LIMIT = 5;

interface MarketPreviews {
  products: Product[];
  debtors: Debtor[];
  transactions: Transaction[];
}

interface MarketDetailViewProps {
  market: Market;
  /**
   * Рынок текущего пользователя. Товары/должники/сделки доступны только по
   * своему рынку, поэтому у чужого рынка остаётся одна вкладка — сотрудники.
   */
  isOwnMarket: boolean;
  previews: MarketPreviews;
}

/**
 * Вид карточки рынка, общий для `/markets/:id` и `/my-market`.
 *
 * Раньше это были два почти идентичных роута на ~400 строк каждый: одинаковые
 * вкладки, StatRow, InfoItem'ы, QuickActions и по своей копии `SellerAvatars`.
 * Различия были частью косметические (`py-2` против `py-3`, отступы StatRow), а
 * частью функциональные — и расходились в разные стороны:
 *
 * - ссылка на владельца: `/markets/:id` всегда вела в `/users/:ownerId`, даже
 *   если владелец — ты сам, а `/my-market` вела в `/profile` в `InfoItem`, но
 *   считала цель отдельно в `EntityCard`. Здесь одно правило на оба места;
 * - «Все» у сотрудников: `/markets/:id` передавал `listState`, из-за чего
 *   фильтр по рынку не доезжал до `/users`. Теперь везде `filterState`.
 *
 * Данные грузят роуты (у них разные ключи и условия `enabled`), сюда приходят
 * готовыми.
 */
export function MarketDetailView({ market, isOwnMarket, previews }: MarketDetailViewProps) {
  const { t } = useTranslation(['markets', 'common', 'transactions']);
  const location = useLocation();

  const { can } = useCan();
  const editModal = useMarketsModals((state) => state.edit);

  const sellersByProduct = useMemo(() => {
    const sellersMap = new Map<string, UserInfo[]>();

    for (const transaction of previews.transactions) {
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
  }, [previews.transactions]);

  // `listState` — «откуда пришёл» для хлебной крошки на карточке сущности.
  // `filterState` — предвыбранный фильтр по рынку для списков.
  const listState = { fromPath: location.pathname, fromName: market.name };
  const filterState = { fromMarketId: market.id, fromMarketName: market.name };

  // Единое правило для владельца: свой профиль — в `/profile` (там есть
  // редактирование), чужой — в карточку пользователя.
  const isOwnerMe = getClientUser()?.id === market.ownerId;
  const ownerTo = isOwnerMe ? '/profile' : `/users/${market.ownerId}`;
  const ownerState = isOwnerMe ? undefined : listState;

  const employeesTab: EntityTab = {
    value: 'employees',
    label: t('fields.employees'),
    count: market.users.length,
    isEmpty: market.users.length === 0,
    emptyMessage: t('noEmployees'),

    rows: market.users.slice(0, MARKET_PREVIEW_LIMIT).map((employee) => (
      <ListLink
        key={employee.id}
        to={employee.role === Role.Seller ? `/sellers/${employee.id}` : `/users/${employee.id}`}
        state={listState}>
        <UserAvatar fullName={employee.name} subInfo={employee.email} imagePath={employee.image ?? undefined} />

        <Badge variant="secondary" className="text-xs font-normal">
          {t(`role.${employee.role.toLowerCase()}`)}
        </Badge>
      </ListLink>
    )),

    viewAll:
      market.users.length > MARKET_PREVIEW_LIMIT
        ? { to: '/users', state: filterState, label: t('viewAll'), count: market.users.length }
        : undefined,
  };

  const productsTab: EntityTab = {
    value: 'products',
    label: t('fields.products'),
    count: market.count.products,
    badgeClassName: 'bg-primary/10 text-primary',
    isEmpty: previews.products.length === 0,
    emptyMessage: t('noProducts'),

    rows: previews.products.map((product) => {
      const sellers = sellersByProduct.get(product.id) ?? [];

      return (
        <ListLink key={product.id} to={`/products/${product.id}`} state={listState}>
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar className="shrink-0">
              {product.image && <AvatarImage src={product.image} alt={product.name} />}

              <AvatarFallback>{product.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{product.name}</p>

              <p className="text-muted-foreground truncate text-sm">
                {product.category?.name && `${product.category.name} · `}
                {t('soldCount', { count: product._count.transactionItems })}
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

    viewAll:
      market.count.products > MARKET_PREVIEW_LIMIT
        ? { to: '/products', state: filterState, label: t('viewAll'), count: market.count.products }
        : undefined,
  };

  const debtorsTab: EntityTab = {
    value: 'debtors',
    label: t('fields.debtors'),
    count: market.count.debtors,
    badgeClassName: 'bg-warning/15 text-warning',
    isEmpty: previews.debtors.length === 0,
    emptyMessage: t('noDebtors'),

    rows: previews.debtors.map((debtor) => (
      <ListLink key={debtor.id} to={`/debtors/${debtor.id}`} state={listState}>
        <span className="truncate text-sm font-medium">{debtor.name}</span>

        <span className="text-muted-foreground text-xs">{debtor.phone}</span>
      </ListLink>
    )),

    viewAll:
      market.count.debtors > MARKET_PREVIEW_LIMIT
        ? { to: '/debtors', state: filterState, label: t('viewAll'), count: market.count.debtors }
        : undefined,
  };

  const transactionsTab: EntityTab = {
    value: 'transactions',
    label: t('fields.transactions'),
    count: market.count.transactions,
    badgeClassName: 'bg-chart-5/15 text-chart-5',
    isEmpty: previews.transactions.length === 0,
    emptyMessage: t('noTransactions'),

    rows: previews.transactions.map((transaction) => (
      <TransactionRow
        key={transaction.id}
        tx={transaction}
        t={t}
        to={`/transactions/${transaction.id}`}
        state={listState}
      />
    )),

    viewAll:
      market.count.transactions > MARKET_PREVIEW_LIMIT
        ? { to: '/transactions', state: filterState, label: t('viewAll'), count: market.count.transactions }
        : undefined,
  };

  const tabs = isOwnMarket ? [employeesTab, productsTab, debtorsTab, transactionsTab] : [employeesTab];

  const quickActions: QuickActionItem[] = [
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
      icon: HandCoins,
      label: t('viewDebtors'),
      render: <Link to="/debtors" state={filterState} />,
    },

    {
      key: 'transactions',
      icon: ReceiptText,
      label: t('viewTransactions'),
      render: <Link to="/transactions" state={filterState} />,
    },
  ];

  return (
    <>
      <Panel>
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
            icon={HandCoins}
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
          <Panel bodyClassName="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
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

                  <InfoLink to={ownerTo} state={ownerState}>
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
            viewTo={ownerTo}
            viewLabel={t('actions.view')}
            viewState={ownerState}
          />

          <QuickActions title={t('quickActions')} actions={quickActions} />
        </div>
      </div>
    </>
  );
}
