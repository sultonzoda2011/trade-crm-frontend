import { useMutation, useQuery } from '@tanstack/react-query';
import { Banknote, HandCoins, Store } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { debtorsApi } from '~/api/debtors';
import { transactionsApi } from '~/api/transactions';
import { CreatePaymentModal } from '~/components/modals/CreatePaymentModal';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { AnimatedNumber } from '~/components/shared/AnimatedNumber';
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
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet';
import { Action } from '~/config/actions';
import { DEBTOR_RISK_BADGE } from '~/config/analyticsBadges';
import { useCan } from '~/hooks/useCan';
import { fmtNum, fmtTJS, formatDate, formatDateShort } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';
import { useTransactionsModals } from '~/routes/(crm)/transactions/store';

const PREVIEW_LIMIT = 5;

export default function DebtorDetailPage() {
  const { t } = useTranslation(['debtors', 'transactions', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useCan();
  const payModal = useTransactionsModals((s) => s.pay);
  const [pickDebtOpen, setPickDebtOpen] = useState(false);

  const {
    data: response,
    isLoading,
    fetchStatus,
  } = useQuery({
    queryKey: queryKeys.full('debtors', id),
    queryFn: () => debtorsApi.getFull(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const debtor = response?.data?.debtor;
  // Карточка ни разу не грузилась и сейчас на паузе из-за офлайна — отличаем
  // от "не найдено" (см. app/lib/network-status.ts).
  const isOfflineEmpty = fetchStatus === 'paused' && !debtor;
  const transactions = response?.data?.transactions?.data ?? [];
  const totalTx = response?.data?.transactions?.meta?.total ?? 0;

  // Открытые долги нужны только когда их несколько и надо выбрать, какой гасить.
  const { data: debtsResponse, isFetching: isDebtsLoading } = useQuery({
    queryKey: [...queryKeys.entity('transactions'), 'debtor-open-debts', id],
    queryFn: () => transactionsApi.getAll(1, 50, {}, [{ key: 'debtorId', value: id }]),
    enabled: pickDebtOpen && !!id,
  });
  const openDebts = (debtsResponse?.data?.data ?? []).filter(
    (tx) => tx.type === 'DEBT' && tx.remainingAmount > 0 && (tx.status === 'ACTIVE' || tx.status === 'PARTIAL')
  );

  // Модалке оплаты нужен полный Transaction — дотягиваем его по id.
  const { mutate: openPay, isPending: isPayLoading } = useMutation({
    mutationFn: (transactionId: string) => transactionsApi.getById(transactionId),
    onSuccess: (res) => {
      setPickDebtOpen(false);
      payModal.open(res.data);
    },
    onError: () => toast.error(t('actions.payLoadError')),
  });

  if (isLoading) return <ByIdSkeleton />;

  if (isOfflineEmpty) {
    return (
      <OfflineBlock
        label={t('offline.noCachedData', { ns: 'common' })}
        onBack={() => navigate('/debtors')}
        backLabel={t('actions.back', { ns: 'common' })}
      />
    );
  }

  if (!debtor) {
    return (
      <NotFoundBlock
        label={t('notFound')}
        onBack={() => navigate('/debtors')}
        backLabel={t('actions.back', { ns: 'common' })}
      />
    );
  }

  const hasDebt = debtor.totalDebtAmount > 0;
  const canGiveDebt = can(Action.TRANSACTIONS_CREATE);
  const canAcceptPayment = can(Action.TRANSACTIONS_EDIT) && debtor.activeDebtCount > 0;

  const handleAcceptPayment = () => {
    // Один открытый долг — сразу окно оплаты; несколько — сначала выбор.
    if (debtor.activeDebtCount === 1 && debtor.activeDebtTransactionId) {
      openPay(debtor.activeDebtTransactionId);
    } else {
      setPickDebtOpen(true);
    }
  };

  const fromState = { fromPath: location.pathname, fromName: debtor.name };

  return (
    <>
      <DetailPage
        crumbs={[
          { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
          {
            link: location.state?.fromPath ?? '/debtors',
            label: location.state?.fromName || t('navigation.debtors', { ns: 'common' }),
          },
          { label: debtor.name },
        ]}
        hero={
          <DetailHero
            avatar={<EntityAvatar name={debtor.name} size="lg" />}
            title={debtor.name}
            subtitle={
              <a href={`tel:${debtor.phone.replace(/\s/g, '')}`} className="text-primary text-base whitespace-nowrap">
                {debtor.phone}
              </a>
            }
            badges={
              hasDebt ? (
                <Badge variant="outline" className={DEBTOR_RISK_BADGE[debtor.risk]}>
                  {t(`risk.${debtor.risk}`)}
                </Badge>
              ) : undefined
            }
            editTo={can(Action.DEBTORS_EDIT) ? `/debtors/${debtor.id}/edit` : undefined}
            editLabel={t('actions.edit', { ns: 'common' })}
            figure={{
              label: t('totalDebt'),
              tone: hasDebt ? 'default' : 'success',
              value: (
                <>
                  <AnimatedNumber value={debtor.totalDebtAmount} format={(v) => fmtNum(Math.round(v))} />
                  <span className="text-muted-foreground ml-1.5 text-lg font-semibold">TJS</span>
                </>
              ),
              caption:
                debtor.overdueAmount > 0 ? (
                  <span className="text-destructive font-medium">
                    {t('profile.overdueAmount')} {fmtTJS(debtor.overdueAmount)}
                    {debtor.maxDaysOverdue > 0 && ` · ${t('profile.daysUnit', { count: debtor.maxDaysOverdue })}`}
                  </span>
                ) : undefined,
            }}
            actions={
              canGiveDebt || canAcceptPayment ? (
                <>
                  {canGiveDebt && (
                    <Button
                      size="lg"
                      render={
                        <Link
                          to="/transactions/create"
                          state={{ debtorId: debtor.id, debtorName: debtor.name, fromPath: location.pathname }}
                        />
                      }>
                      <HandCoins data-icon="inline-start" />
                      {t('actions.giveDebt')}
                    </Button>
                  )}
                  {canAcceptPayment && (
                    <Button size="lg" variant="secondary" loading={isPayLoading} onClick={handleAcceptPayment}>
                      <Banknote data-icon="inline-start" />
                      {t('actions.acceptPayment')}
                    </Button>
                  )}
                </>
              ) : undefined
            }
          />
        }
        aside={
          debtor.market ? (
            <ListGroup title={t('fields.market')}>
              <EntityRow
                name={debtor.market.name}
                subtitle={debtor.market.address ?? undefined}
                image={debtor.market.image}
                shape="square"
                icon={Store}
                to={can(Action.MARKETS_VIEW_BY_ID) ? `/markets/${debtor.market.id}` : undefined}
                state={fromState}
              />
            </ListGroup>
          ) : undefined
        }>
        <DetailFacts
          facts={[
            { label: t('profile.activeDebtCount'), value: debtor.activeDebtCount },
            {
              label: t('profile.nextDueDate'),
              value: debtor.nextDueDate ? formatDate(debtor.nextDueDate) : undefined,
              show: !!debtor.nextDueDate,
            },
            {
              label: t('profile.lastPaymentAt'),
              value: debtor.lastPaymentAt ? formatDate(debtor.lastPaymentAt) : t('profile.never'),
            },
            { label: t('profile.totalIssued'), value: fmtTJS(debtor.totalIssued) },
            { label: t('profile.totalCollected'), value: fmtTJS(debtor.totalCollected) },
            { label: t('profile.repaymentRate'), value: `${Math.round(debtor.repaymentRate * 100)}%` },
          ]}
        />

        {debtor.factors.length > 0 && (
          <ListGroup title={t('risk.whyTitle')} footer={t('riskFactors.score', { count: debtor.score })}>
            {debtor.factors.map((factor) => (
              <ListRow key={factor} title={t(`riskFactors.${factor}`)} />
            ))}
          </ListGroup>
        )}

        <ListGroup
          title={t('transactionsHistory')}
          action={
            totalTx > PREVIEW_LIMIT ? (
              <PanelViewAll
                to="/transactions"
                state={{ fromDebtorId: debtor.id, fromDebtorName: debtor.name }}
                label={t('viewAll')}
                count={totalTx}
              />
            ) : undefined
          }>
          {transactions.length === 0 ? (
            <ListEmpty>{t('noTransactions')}</ListEmpty>
          ) : (
            transactions
              .slice(0, PREVIEW_LIMIT)
              .map((tx) => (
                <TransactionRow
                  key={tx.id}
                  tx={tx}
                  t={t}
                  to={`/transactions/${tx.id}`}
                  state={fromState}
                  showDebtor={false}
                />
              ))
          )}
        </ListGroup>
      </DetailPage>

      <Sheet open={pickDebtOpen} onOpenChange={setPickDebtOpen}>
        <SheetContent side="bottom" className="bg-background max-h-[80dvh]">
          <SheetHeader>
            <SheetTitle>{t('actions.pickDebtTitle')}</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto px-4 pb-4">
            <ListGroup>
              {isDebtsLoading && openDebts.length === 0 ? (
                <p className="text-muted-foreground px-4 py-6 text-center text-sm">
                  {t('customSelect.loading', { ns: 'common' })}
                </p>
              ) : (
                openDebts.map((tx) => (
                  <ListRow
                    key={tx.id}
                    title={
                      tx.items[0]
                        ? `${tx.items[0].productName}${tx.items.length > 1 ? ` +${tx.items.length - 1}` : ''}`
                        : formatDateShort(tx.createdAt)
                    }
                    subtitle={
                      tx.dueDate
                        ? `${formatDateShort(tx.createdAt)} · ${t('fields.dueDate', { ns: 'transactions' })} ${formatDateShort(tx.dueDate)}`
                        : formatDateShort(tx.createdAt)
                    }
                    value={<span className="text-foreground font-semibold">{fmtNum(tx.remainingAmount)}</span>}
                    onClick={() => openPay(tx.id)}
                  />
                ))
              )}
            </ListGroup>
          </div>
        </SheetContent>
      </Sheet>

      <CreatePaymentModal />
    </>
  );
}
