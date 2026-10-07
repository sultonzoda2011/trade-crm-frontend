import { Package, Store } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';

import { SellerAvatars } from '~/components/markets/SellerAvatars';
import { DetailFacts } from '~/components/shared/DetailFacts';
import { DetailHero } from '~/components/shared/DetailHero';
import { DetailPage } from '~/components/shared/DetailPage';
import { EntityAvatar } from '~/components/shared/EntityAvatar';
import { EntityRow } from '~/components/shared/EntityRow';
import { ListGroup } from '~/components/shared/ListGroup';
import { MarketEntityTabs, type EntityTab } from '~/components/shared/MarketEntityTabs';
import { TransactionRow } from '~/components/shared/TransactionRow';

import { Badge } from '~/components/ui/badge';

import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { getClientUser } from '~/lib/auth-utils';
import { fmtTJS, formatDate } from '~/lib/format';
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
 * Вид карточки рынка, общий для `/markets/:id` и «Мой магазин».
 *
 * Данные грузят роуты (у них разные ключи и условия `enabled`), сюда приходят
 * готовыми. Правки здесь отражаются на обоих входах.
 *
 * - Ссылка на владельца одна на оба места: свой профиль — в `/profile`
 *   (там есть редактирование), чужой — в карточку пользователя.
 * - «Все» у вкладок везде несёт `filterState`, чтобы список открывался уже
 *   отфильтрованным по этому рынку.
 */
export function MarketDetailView({ market, isOwnMarket, previews }: MarketDetailViewProps) {
  const { t } = useTranslation(['markets', 'common', 'transactions']);
  const location = useLocation();

  const { can } = useCan();

  const sellersByProduct = useMemo(() => {
    const sellersMap = new Map<string, UserInfo[]>();

    for (const transaction of previews.transactions) {
      // Автор может отсутствовать в ответе (удалённый пользователь, урезанное
      // превью) — такую транзакцию просто не учитываем среди продавцов.
      const author = transaction.createdBy;
      if (!author) continue;

      for (const item of transaction.items ?? []) {
        const sellers = sellersMap.get(item.productId) ?? [];

        if (!sellers.some((seller) => seller.id === author.id)) {
          sellers.push(author);
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
      <EntityRow
        key={employee.id}
        name={employee.name}
        subtitle={employee.email}
        image={employee.image}
        to={employee.role === Role.Seller ? `/sellers/${employee.id}` : `/users/${employee.id}`}
        state={listState}
        value={
          <Badge variant="secondary" className="text-xs font-normal">
            {t(`role.${employee.role.toLowerCase()}`)}
          </Badge>
        }
      />
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

    rows: previews.products.map((product) => (
      <EntityRow
        key={product.id}
        name={product.name}
        subtitle={`${product.category?.name ? `${product.category.name} · ` : ''}${t('soldCount', { count: product._count.transactionItems })}`}
        image={product.image}
        shape="square"
        icon={Package}
        to={`/products/${product.id}`}
        state={listState}
        value={
          <span className="flex items-center gap-2.5">
            <SellerAvatars sellers={sellersByProduct.get(product.id) ?? []} />
            <span className="text-foreground font-mono text-sm font-semibold">{fmtTJS(product.price)}</span>
          </span>
        }
      />
    )),

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
      <EntityRow
        key={debtor.id}
        name={debtor.name}
        subtitle={debtor.phone}
        to={`/debtors/${debtor.id}`}
        state={listState}
      />
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

  return (
    <DetailPage
      crumbs={
        // Список магазинов открыт только админу; у владельца и продавца «назад» — на главную.
        can(Action.MARKETS_VIEW)
          ? [
              { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
              {
                link: location.state?.fromPath ?? '/markets',
                label: location.state?.fromName || t('navigation.markets', { ns: 'common' }),
              },
              { label: market.name },
            ]
          : [{ label: t('navigation.dashboard', { ns: 'common' }), link: '/' }, { label: market.name }]
      }
      hero={
        <DetailHero
          avatar={<EntityAvatar name={market.name} image={market.image} icon={Store} shape="square" size="lg" />}
          title={market.name}
          subtitle={market.address}
          editTo={can(Action.MARKETS_EDIT) ? `/markets/${market.id}/edit` : undefined}
          editLabel={t('actions.edit')}
          stats={[
            { label: t('fields.products'), value: market.count.products, to: '/products', state: filterState },
            { label: t('fields.debtors'), value: market.count.debtors, to: '/debtors', state: filterState },
            {
              label: t('fields.transactions'),
              value: market.count.transactions,
              to: '/transactions',
              state: filterState,
            },
          ]}
        />
      }
      aside={
        <ListGroup title={t('fields.owner')}>
          <EntityRow
            name={market.owner.name}
            subtitle={market.owner.email}
            image={market.owner.image}
            to={ownerTo}
            state={ownerState}
          />
        </ListGroup>
      }>
      <DetailFacts
        facts={[
          { label: t('fields.address'), value: market.address },
          { label: t('fields.createdAt'), value: formatDate(market.createdAt, true) },
          { label: t('fields.updatedAt'), value: formatDate(market.updatedAt, true) },
        ]}
      />

      <MarketEntityTabs variant="grouped" defaultValue="employees" tabs={tabs} />
    </DetailPage>
  );
}
