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
import { InfoItem } from '~/components/shared/InfoItem';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { Action } from '~/config/actions';
import { ROLE_CONFIG } from '~/config/enumOptions';
import { useCan } from '~/hooks/useCan';
import { fmtTJS, formatDate } from '~/lib/format';
import { Role } from '~/types/common';
import { useUsersModals } from '../store';

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
      <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">{t('notFound')}</p>
        <Button variant="outline" onClick={() => navigate('/users')}>
          {t('actions.back', { ns: 'common' })}
        </Button>
      </div>
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
        <div className="flex items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <Avatar className="size-16 rounded-xl">
              {user.image && <AvatarImage src={user.image} alt={user.name} className="object-cover" />}
              <AvatarFallback className="bg-muted rounded-xl text-2xl font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
                <Badge variant="outline">{roleLabel}</Badge>
              </div>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
          </div>
          {can(Action.USERS_EDIT) && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => editModal.open(user)}>
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
              <InfoItem label={t('fields.name')} value={user.name} />
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
                  <div className="bg-muted/50 h-12 animate-pulse rounded-lg" />
                ) : (
                  ownedMarkets.slice(0, 5).map((m) => (
                    <Link
                      key={m.id}
                      to={`/markets/${m.id}`}
                      state={{ fromPath: location.pathname, fromName: user.name }}
                      className="hover:bg-muted/40 -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2.5 transition-colors">
                      <span className="text-sm font-medium">{m.name}</span>
                      <ArrowUpRight className="text-muted-foreground size-3.5 shrink-0" />
                    </Link>
                  ))
                )}
              </div>
            </Panel>
          )}

          {!ownedMarkets.length && user.market && (
            <Panel title={t('fields.market')}>
              <div className="space-y-4">
                <InfoItem
                  label={t('fields.name')}
                  value={
                    <Link
                      to={`/markets/${user.market.id}`}
                      className="group text-primary inline-flex items-center gap-1 text-sm font-semibold hover:underline">
                      {user.market.name}
                      <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  }
                />
                {user.market.address && <InfoItem label={t('fields.address')} value={user.market.address} />}
              </div>
            </Panel>
          )}

          {userTransactions.length > 0 && (
            <Panel
              title={t('transactionsHistory')}
              actions={
                <Link
                  to="/transactions"
                  state={{ fromSellerId: user.id, fromSellerName: user.name }}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium transition-colors">
                  {t('viewAll')} ({totalTx})
                  <ArrowUpRight className="size-3" />
                </Link>
              }>
              {isTxLoading ? (
                <div className="bg-muted/50 h-24 animate-pulse rounded-lg" />
              ) : (
                <div className="divide-border divide-y">
                  {userTransactions.map((tx) => (
                    <Link
                      key={tx.id}
                      to={`/transactions/${tx.id}`}
                      state={{ fromPath: location.pathname, fromName: user.name }}
                      className="hover:bg-muted/40 -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-3 transition-colors">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate text-sm font-medium">
                          #{tx.id.slice(0, 8)}
                          <Badge
                            variant="outline"
                            className={
                              tx.status === 'PAID'
                                ? 'border-success/40 bg-success/15 text-success text-xs font-normal'
                                : tx.status === 'REFUNDED'
                                  ? 'border-destructive/40 bg-destructive/15 text-destructive text-xs font-normal'
                                  : 'border-warning/40 bg-warning/15 text-warning text-xs font-normal'
                            }>
                            {t(`status.${tx.status}`, { ns: 'transactions', defaultValue: tx.status })}
                          </Badge>
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatDate(tx.createdAt, true)}
                          {tx.debtor && <> · {tx.debtor.name}</>}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-semibold">{fmtTJS(tx.totalAmount)}</p>
                        {tx.remainingAmount > 0 && (
                          <p className="text-warning font-mono text-xs">
                            {t('remaining', { ns: 'transactions', defaultValue: 'Остаток' })}:{' '}
                            {fmtTJS(tx.remainingAmount)}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Panel>
          )}

          <Panel title={t('quickActions', { defaultValue: 'Быстрые действия' })}>
            <div className="space-y-2">
              {can(Action.USERS_EDIT) && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  size="sm"
                  onClick={() => editModal.open(user)}>
                  <Pencil className="size-3.5" />
                  {t('actions.edit')}
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                size="sm"
                render={<Link to="/transactions" />}>
                <ReceiptText className="size-3.5" />
                {t('transactionsHistory', { defaultValue: 'Транзакции' })}
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2" size="sm" render={<Link to="/markets" />}>
                <Store className="size-3.5" />
                {t('viewMarkets', { defaultValue: 'Рынки' })}
              </Button>
            </div>
          </Panel>
        </div>
      </div>

      <EditUserModal />
    </div>
  );
}
