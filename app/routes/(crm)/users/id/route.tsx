import { useQuery } from '@tanstack/react-query';
import { Store } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router';
import { usersApi } from '~/api/users';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { DetailFacts } from '~/components/shared/DetailFacts';
import { DetailHero } from '~/components/shared/DetailHero';
import { DetailPage } from '~/components/shared/DetailPage';
import { EntityAvatar } from '~/components/shared/EntityAvatar';
import { EntityRow } from '~/components/shared/EntityRow';
import { ListGroup } from '~/components/shared/ListGroup';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import { PanelViewAll } from '~/components/shared/PanelViewAll';
import { TransactionRow } from '~/components/shared/TransactionRow';
import { Badge } from '~/components/ui/badge';
import { Action } from '~/config/actions';
import { ROLE_CONFIG } from '~/config/enumOptions';
import { useCan } from '~/hooks/useCan';
import { formatDate } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';

export default function UserDetailPage() {
  const { t } = useTranslation(['users', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useCan();

  const { data: response, isLoading } = useQuery({
    queryKey: queryKeys.full('users', id),
    queryFn: () => usersApi.getFull(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const user = response?.data?.user;
  const ownedMarkets = response?.data?.markets?.data ?? [];
  const userTransactions = useMemo(() => response?.data?.transactions?.data ?? [], [response]);
  const totalTx = response?.data?.transactions?.meta?.total ?? 0;

  if (isLoading) return <ByIdSkeleton />;

  if (!user) {
    return (
      <NotFoundBlock
        label={t('notFound')}
        onBack={() => navigate('/users')}
        backLabel={t('actions.back', { ns: 'common' })}
      />
    );
  }

  const fromState = { fromPath: location.pathname, fromName: user.name };
  const roleConfig = ROLE_CONFIG[user.role];
  const roleLabel = roleConfig ? roleConfig.label(t) : user.role;
  // Владелец — по списку своих магазинов; у продавца магазин один, он лежит в `user.market`.
  const markets = ownedMarkets.length > 0 ? ownedMarkets.slice(0, 5) : user.market ? [user.market] : [];

  return (
    <DetailPage
      crumbs={[
        { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
        {
          link: location.state?.fromPath,
          label: location.state?.fromName || t('navigation.users', { ns: 'common' }),
        },
        { label: user.name },
      ]}
      hero={
        <DetailHero
          avatar={<EntityAvatar name={user.name} image={user.image} size="lg" />}
          title={user.name}
          subtitle={user.email}
          badges={
            <Badge variant="outline" className={roleConfig?.className}>
              {roleLabel}
            </Badge>
          }
          editTo={can(Action.USERS_EDIT) ? `/users/${user.id}/edit` : undefined}
          editLabel={t('actions.edit')}
        />
      }
      aside={
        markets.length > 0 ? (
          <ListGroup title={t('fields.market')}>
            {markets.map((market) => (
              <EntityRow
                key={market.id}
                name={market.name}
                subtitle={market.address ?? undefined}
                image={market.image}
                shape="square"
                icon={Store}
                to={`/markets/${market.id}`}
                state={fromState}
              />
            ))}
          </ListGroup>
        ) : undefined
      }>
      <DetailFacts
        facts={[
          { label: t('fields.email'), value: user.email },
          { label: t('fields.role'), value: roleLabel },
          { label: t('fields.createdAt'), value: formatDate(user.createdAt, true) },
          { label: t('fields.updatedAt'), value: formatDate(user.updatedAt, true) },
        ]}
      />

      {userTransactions.length > 0 && (
        <ListGroup
          title={t('transactionsHistory')}
          action={
            <PanelViewAll
              to="/transactions"
              state={{ fromSellerId: user.id, fromSellerName: user.name }}
              label={t('viewAll')}
              count={totalTx}
            />
          }>
          {userTransactions.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} t={t} to={`/transactions/${tx.id}`} state={fromState} />
          ))}
        </ListGroup>
      )}
    </DetailPage>
  );
}
