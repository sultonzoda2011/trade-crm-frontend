import { useQuery } from '@tanstack/react-query';
import { Store, Wallet } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router';
import { sellersApi } from '~/api/sellers';
import { PayoutSellerModal } from '~/components/modals/PayoutSellerModal';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { DetailFacts } from '~/components/shared/DetailFacts';
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
import { fmtTJS, formatDate } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';
import { useSellersModals } from '~/routes/(crm)/sellers/store';

export default function SellerDetailPage() {
  const { t } = useTranslation(['sellers', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useCan();
  const payoutModal = useSellersModals((s) => s.payout);

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
  const credits = useMemo(() => response?.data?.credits?.data ?? [], [response]);
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
  const hasBalance = !!balance && balance.earned > 0;
  const canPayout = can(Action.SELLERS_EDIT) && !!balance && balance.balance > 0;

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
            subtitle={seller.email}
            editTo={can(Action.SELLERS_EDIT) ? `/sellers/${seller.id}/edit` : undefined}
            editLabel={t('actions.edit')}
            stats={
              hasBalance
                ? [
                    { label: t('earned'), value: fmtTJS(balance.earned) },
                    { label: t('paidOut'), value: fmtTJS(balance.paidOut) },
                    {
                      label: t('balance'),
                      value: fmtTJS(balance.balance),
                      tone: balance.balance > 0 ? 'success' : 'default',
                    },
                  ]
                : undefined
            }
            actions={
              canPayout ? (
                <Button size="lg" onClick={() => payoutModal.open(seller)}>
                  <Wallet data-icon="inline-start" />
                  {t('payout')}
                </Button>
              ) : undefined
            }
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
        <DetailFacts
          facts={[
            { label: t('fields.email'), value: seller.email },
            { label: t('fields.createdAt'), value: formatDate(seller.createdAt, true) },
          ]}
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

        <ListGroup title={t('markupBalance')}>
          {!hasBalance ? (
            <ListEmpty>{t('noBalance')}</ListEmpty>
          ) : (
            <>
              <ListRow title={t('earned')} value={fmtTJS(balance.earned)} valueClassName="text-foreground font-mono" />
              {balance.refunded > 0 && (
                <ListRow
                  title={t('refunded')}
                  value={`− ${fmtTJS(balance.refunded)}`}
                  valueClassName="text-destructive font-mono"
                />
              )}
              <ListRow
                title={t('paidOut')}
                value={fmtTJS(balance.paidOut)}
                valueClassName="text-foreground font-mono"
              />
              <ListRow
                title={t('balance')}
                value={fmtTJS(balance.balance)}
                valueClassName="text-success font-mono font-semibold"
              />
            </>
          )}
        </ListGroup>

        {credits.length > 0 && (
          <ListGroup title={t('creditsHistory')}>
            {credits.map((credit) => (
              <ListRow
                key={credit.id}
                title={<span className="font-mono font-medium">{fmtTJS(credit.amount)}</span>}
                subtitle={credit.note || undefined}
                value={<span className="text-xs">{formatDate(credit.createdAt, true)}</span>}
              />
            ))}
          </ListGroup>
        )}
      </DetailPage>
      <PayoutSellerModal />
    </>
  );
}
