import { useQuery } from '@tanstack/react-query';
import { KeyRound, Store, UserCheck, UserX, Wallet } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router';
import { sellersApi } from '~/api/sellers';
import { EarningsFeed } from '~/components/sellers/EarningsFeed';
import { SellerDialogs } from '~/components/sellers/SellerDialogs';
import { SellerStatusBadge } from '~/components/sellers/SellerStatusBadge';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { ConfirmDialog } from '~/components/shared/ConfirmDialog';
import { DetailHero } from '~/components/shared/DetailHero';
import { DetailPage } from '~/components/shared/DetailPage';
import { EntityAvatar } from '~/components/shared/EntityAvatar';
import { EntityRow } from '~/components/shared/EntityRow';
import { ListEmpty, ListGroup, ListRow } from '~/components/shared/ListGroup';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import { OfflineBlock } from '~/components/shared/OfflineBlock';
import { PanelViewAll } from '~/components/shared/PanelViewAll';
import { TransactionRow } from '~/components/shared/TransactionRow';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { useDeleteEntity } from '~/hooks/useDeleteEntity';
import { useSellerAccess } from '~/hooks/useSellerActions';
import { getClientUser } from '~/lib/auth-utils';
import { fmtNum, fmtTJS, formatDate } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';
import { useSellersModals } from '~/routes/(crm)/sellers/store';

export default function SellerDetailPage() {
  const { t } = useTranslation(['sellers', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useCan();
  const { requestDelete, deleteDialog } = useDeleteEntity({
    entity: 'sellers',
    api: sellersApi,
    id,
    t,
    redirectTo: '/sellers',
    alsoInvalidate: ['users'],
  });
  const payoutModal = useSellersModals((s) => s.payout);
  const resetModal = useSellersModals((s) => s.reset);
  const deactivateModal = useSellersModals((s) => s.deactivate);
  const { activate } = useSellerAccess();

  const {
    data: response,
    isLoading,
    fetchStatus,
  } = useQuery({
    queryKey: queryKeys.full('sellers', id),
    queryFn: () => sellersApi.getFull(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const seller = response?.data?.seller;
  const transactions = useMemo(() => response?.data?.transactions?.data ?? [], [response]);
  const totalTx = response?.data?.transactions?.meta?.total ?? 0;
  const balance = response?.data?.balance;
  const feed = response?.data?.feed;
  const month = response?.data?.month;
  // Карточка ни разу не грузилась и сейчас на паузе из-за офлайна — отличаем
  // от "не найдено" (см. app/lib/network-status.ts).
  const isOfflineEmpty = fetchStatus === 'paused' && !seller;

  if (isLoading) return <ByIdSkeleton />;

  if (isOfflineEmpty) {
    return (
      <OfflineBlock
        label={t('offline.noCachedData', { ns: 'common' })}
        onBack={() => navigate('/sellers')}
        backLabel={t('actions.back', { ns: 'common' })}
      />
    );
  }

  if (!seller) {
    return (
      <NotFoundBlock
        label={t('notFound')}
        onBack={() => navigate('/sellers')}
        backLabel={t('actions.back', { ns: 'common' })}
      />
    );
  }

  const fromState = { fromPath: location.pathname, fromName: seller.name };
  const isSelf = getClientUser()?.id === seller.id;
  const hasHistory = !!seller.hasHistory;
  // Выплатить можно и отключённому: деньги ему должны, пока их не отдали.
  const canPayout = can(Action.SELLERS_PAYOUT) && !!balance && balance.balance > 0;
  const canEdit = can(Action.SELLERS_EDIT);
  const hasMoney = !!balance && (balance.earned > 0 || balance.paidOut > 0);
  const overpaid = !!balance && balance.balance < 0;
  const tone = !balance ? 'default' : overpaid ? 'warning' : balance.balance > 0 ? 'success' : 'default';

  return (
    <>
      <DetailPage
        crumbs={[
          { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
          {
            link: location.state?.fromPath,
            label: location.state?.fromName || t('navigation.sellers', { ns: 'common' }),
          },
          { label: seller.name },
        ]}
        hero={
          <DetailHero
            avatar={<EntityAvatar name={seller.name} image={seller.image} size="lg" />}
            title={seller.name}
            subtitle={[seller.email, seller.phone].filter(Boolean).join(' · ')}
            badges={<SellerStatusBadge isActive={seller.isActive} />}
            figure={
              balance
                ? {
                    label: overpaid ? t('balance.overpaid') : t('balance.toPay'),
                    value: fmtTJS(balance.balance),
                    tone,
                    caption:
                      balance.pendingInDebts > 0
                        ? t('balance.pendingCaption', { amount: fmtNum(balance.pendingInDebts) })
                        : overpaid
                          ? t('balance.overpaidHint')
                          : undefined,
                  }
                : undefined
            }
            stats={
              month
                ? [
                    { label: t('month.sold'), value: fmtNum(month.sold) },
                    { label: t('month.earned'), value: fmtNum(month.earned) },
                    { label: t('month.sales'), value: month.salesCount },
                  ]
                : undefined
            }
            actions={
              canPayout ? (
                <Button size="lg" onClick={() => payoutModal.open(seller)}>
                  <Wallet data-icon="inline-start" />
                  {t('payout.submit')}
                </Button>
              ) : undefined
            }
            manage={{
              editTo: canEdit ? `/sellers/${seller.id}/edit` : undefined,
              // Удалить можно только «чистого» продавца; остальных — отключить (блок «Доступ»).
              onDelete: can(Action.SELLERS_DELETE) && !hasHistory && !isSelf ? requestDelete : undefined,
            }}
          />
        }
        aside={
          seller.market ? (
            <ListGroup title={t('fields.market')}>
              <EntityRow
                name={seller.market.name}
                subtitle={seller.market.address ?? undefined}
                image={seller.market.image}
                shape="square"
                icon={Store}
                to={`/markets/${seller.market.id}`}
                state={fromState}
              />
            </ListGroup>
          ) : undefined
        }>
        <ListGroup title={t('balance.title')} footer={hasMoney ? t('balance.footer') : undefined}>
          {!hasMoney || !balance ? (
            <ListEmpty>{t('balance.empty')}</ListEmpty>
          ) : (
            <>
              <ListRow
                title={t('balance.earned')}
                value={fmtTJS(balance.earned)}
                valueClassName="text-foreground font-mono"
              />
              {balance.refunded > 0 && (
                <ListRow
                  title={t('balance.refunded')}
                  value={`− ${fmtTJS(balance.refunded)}`}
                  valueClassName="text-destructive font-mono"
                />
              )}
              <ListRow
                title={t('balance.paidOut')}
                value={`− ${fmtTJS(balance.paidOut)}`}
                valueClassName="text-foreground font-mono"
              />
              <ListRow
                title={<span className="font-semibold">{overpaid ? t('balance.overpaid') : t('balance.toPay')}</span>}
                value={fmtTJS(balance.balance)}
                valueClassName={
                  overpaid ? 'text-warning font-mono font-semibold' : 'text-success font-mono font-semibold'
                }
              />
              {balance.pendingInDebts > 0 && (
                <ListRow
                  title={t('balance.pendingInDebts')}
                  subtitle={t('balance.pendingInDebtsHint')}
                  value={fmtTJS(balance.pendingInDebts)}
                  valueClassName="text-muted-foreground font-mono"
                />
              )}
            </>
          )}
        </ListGroup>

        <EarningsFeed
          seller={{ id: seller.id, name: seller.name }}
          initial={feed}
          canReverse={can(Action.SELLERS_PAYOUT)}
          fromState={fromState}
        />

        <ListGroup
          title={t('transactionsHistory')}
          action={
            transactions.length > 0 ? (
              <PanelViewAll
                to="/transactions"
                state={{ fromSellerId: seller.id, fromSellerName: seller.name }}
                label={t('filters.all', { ns: 'common' })}
                count={totalTx}
              />
            ) : undefined
          }>
          {transactions.length === 0 ? (
            <ListEmpty>{t('noTransactions')}</ListEmpty>
          ) : (
            transactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} t={t} to={`/transactions/${tx.id}`} state={fromState} />
            ))
          )}
        </ListGroup>

        {canEdit && (
          <ListGroup
            title={t('access.title')}
            footer={
              seller.isActive
                ? hasHistory
                  ? t('access.footerWithHistory')
                  : t('access.footer')
                : t('access.footerDisabled', { date: formatDate(seller.deactivatedAt) })
            }>
            <ListRow
              leading={<KeyRound className="text-muted-foreground size-5" />}
              title={t('resetPassword.title')}
              subtitle={
                seller.passwordChangedAt
                  ? t('access.passwordChanged', { date: formatDate(seller.passwordChangedAt) })
                  : undefined
              }
              chevron
              onClick={() => resetModal.open({ id: seller.id, name: seller.name })}
            />
            {!isSelf &&
              (seller.isActive ? (
                <ListRow
                  leading={<UserX className="text-destructive size-5" />}
                  title={t('access.deactivate')}
                  destructive
                  onClick={() => deactivateModal.open({ id: seller.id, name: seller.name })}
                />
              ) : (
                <ListRow
                  leading={<UserCheck className="text-success size-5" />}
                  title={t('access.activate')}
                  onClick={() => activate.mutate(seller.id)}
                />
              ))}
          </ListGroup>
        )}
      </DetailPage>
      <SellerDialogs />
      <ConfirmDialog {...deleteDialog} />
    </>
  );
}
