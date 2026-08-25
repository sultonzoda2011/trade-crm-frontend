import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Pencil, ReceiptText, Store } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { marketsApi } from '~/api/markets';
import { transactionsApi } from '~/api/transactions';
import { usersApi } from '~/api/users';
import { Panel } from '~/components/layout/Panel';
import { EditUserModal } from '~/components/modals/EditUserModal';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { DetailHeader } from '~/components/shared/DetailHeader';
import { InfoItem } from '~/components/shared/InfoItem';
import { ListLink } from '~/components/shared/ListLink';
import { MarketCard } from '~/components/shared/MarketCard';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import { PanelViewAll } from '~/components/shared/PanelViewAll';
import { QuickActions } from '~/components/shared/QuickActions';
import { SkeletonList } from '~/components/shared/SkeletonList';
import { TransactionRow } from '~/components/shared/TransactionRow';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Action } from '~/config/actions';
import { ROLE_CONFIG } from '~/config/enumOptions';
import { useCan } from '~/hooks/useCan';
import { formatDate } from '~/lib/format';
import { useUsersModals } from '~/routes/(crm)/users/store';
import { Role } from '~/types/common';

export default function UserDetailPage() {
  const { t } = useTranslation(['users', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useCan();
  const editModal = useUsersModals((s) => s.edit);

  const { data: response, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const user = response?.data;

  const isAdminOrOwner = useMemo(() => user?.role === Role.Admin || user?.role === Role.Owner, [user?.role]);

  const { data: marketsResponse, isLoading: isMarketsLoading } = useQuery({
    queryKey: ['user-markets', id],
    queryFn: () => marketsApi.getAll(1, 100, {}, [{ key: 'ownerId', value: id! }]),
    enabled: !!id && !!user && isAdminOrOwner,
    staleTime: 30_000,
  });

  const ownedMarkets = marketsResponse?.data?.data ?? [];

  const { data: txResponse, isLoading: isTxLoading } = useQuery({
    queryKey: ['user-transactions', id],
    queryFn: () => transactionsApi.getAll(1, 5, {}, [{ key: 'createdById', value: id! }]),
    enabled: !!id,
    staleTime: 30_000,
  });

  const userTransactions = useMemo(() => txResponse?.data?.data ?? [], [txResponse]);
  const totalTx = txResponse?.data?.meta?.total ?? 0;

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

  const roleLabel =
    user.role === Role.Admin ? t('role.admin') : user.role === Role.Owner ? t('role.owner') : t('role.seller');

  return (
    <div className="flex flex-1 flex-col space-y-6 pb-8">
      <BreadCrumbs
        items={[
          { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
          {
            link: location.state?.fromPath,
            label: location.state?.fromName || t('navigation.users', { ns: 'common' }),
          },
          { label: user.name },
        ]}
      />

      <Panel className="p-6">
        <DetailHeader
          name={user.name}
          subtitle={user.email}
          image={user.image}
          badges={<Badge variant="outline">{roleLabel}</Badge>}
        />
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InfoItem
                label={t('fields.name')}
                value={
                  <span className="flex items-center gap-2">
                    <Avatar size="sm" className="shrink-0">
                      {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
                      <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{user.name}</span>
                  </span>
                }
              />
              <InfoItem label={t('fields.email')} value={user.email} />
              <InfoItem
                label={t('fields.role')}
                value={
                  <Badge variant="outline" className={ROLE_CONFIG[user.role]?.className}>
                    {ROLE_CONFIG[user.role] ? ROLE_CONFIG[user.role].label(t) : user.role}
                  </Badge>
                }
              />
              <InfoItem label={t('fields.createdAt')} value={formatDate(user.createdAt, true)} />
              <InfoItem label={t('fields.updatedAt')} value={formatDate(user.updatedAt, true)} />
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          {ownedMarkets.length > 0 && (
            <Panel title={t('fields.market')}>
              <div className="divide-border divide-y">
                {isMarketsLoading ? (
                  <SkeletonList count={3} height="h-12" className="py-0" />
                ) : (
                  ownedMarkets.slice(0, 5).map((m) => (
                    <ListLink
                      key={m.id}
                      to={`/markets/${m.id}`}
                      state={{ fromPath: location.pathname, fromName: user.name }}
                      className="py-2.5">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <Avatar size="sm" className="shrink-0">
                          {m.image ? <AvatarImage src={m.image} alt={m.name} /> : null}
                          <AvatarFallback>{m.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="truncate text-sm font-medium">{m.name}</span>
                      </span>
                      <ArrowUpRight className="text-muted-foreground size-3.5 shrink-0" />
                    </ListLink>
                  ))
                )}
              </div>
            </Panel>
          )}

          {!ownedMarkets.length && user.market && (
            <MarketCard market={user.market} t={t} viewState={{ fromPath: location.pathname, fromName: user.name }} />
          )}

          {userTransactions.length > 0 && (
            <Panel
              title={t('transactionsHistory')}
              actions={
                <PanelViewAll
                  to="/transactions"
                  state={{ fromSellerId: user.id, fromSellerName: user.name }}
                  label={t('viewAll')}
                  count={totalTx}
                />
              }>
              {isTxLoading ? (
                <SkeletonList count={3} height="h-24" className="py-0" />
              ) : (
                <div className="divide-border divide-y">
                  {userTransactions.map((tx) => (
                    <TransactionRow
                      key={tx.id}
                      tx={tx}
                      t={t}
                      to={`/transactions/${tx.id}`}
                      state={{ fromPath: location.pathname, fromName: user.name }}
                    />
                  ))}
                </div>
              )}
            </Panel>
          )}

          <QuickActions
            title={t('quickActions')}
            actions={[
              ...(can(Action.USERS_EDIT)
                ? [
                    {
                      icon: Pencil,
                      label: t('actions.edit'),
                      variant: 'outline' as const,
                      onClick: () => editModal.open(user),
                    },
                  ]
                : []),
              {
                icon: ReceiptText,
                label: t('transactionsHistory'),
                render: <Link to="/transactions" />,
              },
              {
                icon: Store,
                label: t('viewMarkets'),
                render: <Link to="/markets" />,
              },
            ]}
          />
        </div>
      </div>

      <EditUserModal />
    </div>
  );
}
