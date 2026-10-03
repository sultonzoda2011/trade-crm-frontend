import { useMutation, useQuery } from '@tanstack/react-query';
import { Banknote, ChevronRight, HandCoins, Pencil, Store } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { debtorsApi } from '~/api/debtors';
import { transactionsApi } from '~/api/transactions';
import { CreatePaymentModal } from '~/components/modals/CreatePaymentModal';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { InitialAvatar } from '~/components/shared/InitialAvatar';
import { ListGroup, ListRow } from '~/components/shared/ListGroup';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import { TransactionRow } from '~/components/shared/TransactionRow';
import { Badge } from '~/components/ui/badge';
import BreadCrumbs from '~/components/ui/bread-crumb';
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

  const { data: response, isLoading } = useQuery({
    queryKey: queryKeys.full('debtors', id),
    queryFn: () => debtorsApi.getFull(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const debtor = response?.data?.debtor;
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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col space-y-5 pb-6">
      <BreadCrumbs
        items={[
          { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
          {
            link: location.state?.fromPath ?? '/debtors',
            label: location.state?.fromName || t('navigation.debtors', { ns: 'common' }),
          },
          { label: debtor.name },
        ]}
      />

      <div className="bg-card rounded-2xl p-5">
        <div className="flex items-center gap-3.5">
          <InitialAvatar name={debtor.name} className="size-14 text-xl" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl leading-tight font-bold">{debtor.name}</h1>
            <a href={`tel:${debtor.phone.replace(/\s/g, '')}`} className="text-primary text-base whitespace-nowrap">
              {debtor.phone}
            </a>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-muted-foreground text-sm">{t('totalDebt')}</p>
            {hasDebt && (
              <Badge variant="outline" className={DEBTOR_RISK_BADGE[debtor.risk]}>
                {t(`risk.${debtor.risk}`)}
              </Badge>
            )}
          </div>
          <p className={`font-mono text-4xl leading-tight font-bold ${hasDebt ? '' : 'text-success'}`}>
            {fmtNum(debtor.totalDebtAmount)}
            <span className="text-muted-foreground ml-1.5 text-lg font-semibold">TJS</span>
          </p>
          {debtor.overdueAmount > 0 && (
            <p className="text-destructive mt-0.5 text-sm font-medium">
              {t('profile.overdueAmount')} {fmtTJS(debtor.overdueAmount)}
              {debtor.maxDaysOverdue > 0 && ` · ${t('profile.daysUnit', { count: debtor.maxDaysOverdue })}`}
            </p>
          )}
        </div>

        {(canGiveDebt || canAcceptPayment) && (
          <div className="mt-5 space-y-2.5">
            {canGiveDebt && (
              <Button
                size="lg"
                className="w-full"
                render={
                  <Link
                    to="/transactions/create"
                    state={{ debtorId: debtor.id, debtorName: debtor.name, fromPath: location.pathname }}
                  />
                }>
                <HandCoins />
                {t('actions.giveDebt')}
              </Button>
            )}
            {canAcceptPayment && (
              <Button
                size="lg"
                variant="secondary"
                className="w-full"
                disabled={isPayLoading}
                onClick={handleAcceptPayment}>
                <Banknote />
                {t('actions.acceptPayment')}
              </Button>
            )}
          </div>
        )}
      </div>

      <ListGroup>
        <ListRow title={t('profile.activeDebtCount')} value={debtor.activeDebtCount} />
        {debtor.nextDueDate && (
          <ListRow title={t('profile.nextDueDate')} value={formatDate(debtor.nextDueDate)} />
        )}
        <ListRow
          title={t('profile.lastPaymentAt')}
          value={debtor.lastPaymentAt ? formatDate(debtor.lastPaymentAt) : t('profile.never')}
        />
        <ListRow title={t('profile.totalIssued')} value={fmtTJS(debtor.totalIssued)} />
        <ListRow title={t('profile.totalCollected')} value={fmtTJS(debtor.totalCollected)} />
        <ListRow title={t('profile.repaymentRate')} value={`${Math.round(debtor.repaymentRate * 100)}%`} />
      </ListGroup>

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
            <Link
              to="/transactions"
              state={{ fromDebtorId: debtor.id, fromDebtorName: debtor.name }}
              className="text-primary inline-flex items-center">
              {t('viewAll')} · {totalTx}
              <ChevronRight className="size-4" />
            </Link>
          ) : undefined
        }>
        {transactions.length === 0 ? (
          <p className="text-muted-foreground px-4 py-6 text-center text-sm">{t('noTransactions')}</p>
        ) : (
          transactions
            .slice(0, PREVIEW_LIMIT)
            .map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                t={t}
                to={`/transactions/${tx.id}`}
                state={{ fromPath: location.pathname, fromName: debtor.name }}
                showDebtor={false}
              />
            ))
        )}
      </ListGroup>

      {(can(Action.DEBTORS_EDIT) || debtor.market) && (
        <ListGroup>
          {can(Action.DEBTORS_EDIT) && (
            <ListRow
              leading={<Pencil className="text-primary size-5" />}
              title={t('actions.edit', { ns: 'common' })}
              to={`/debtors/${debtor.id}/edit`}
            />
          )}
          {debtor.market && (
            <ListRow
              leading={<Store className="text-primary size-5" />}
              title={t('fields.market')}
              value={debtor.market.name}
              to={can(Action.MARKETS_VIEW_BY_ID) ? `/markets/${debtor.market.id}` : undefined}
            />
          )}
        </ListGroup>
      )}

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
                    title={tx.items[0] ? `${tx.items[0].productName}${tx.items.length > 1 ? ` +${tx.items.length - 1}` : ''}` : formatDateShort(tx.createdAt)}
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
    </div>
  );
}
