import { useQuery } from '@tanstack/react-query';
import { CreditCard, Share2, StickyNote, Store, Undo2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { transactionsApi } from '~/api/transactions';
import { CreatePaymentModal } from '~/components/modals/CreatePaymentModal';
import { RefundTransactionModal } from '~/components/modals/RefundTransactionModal';
import { AnimatedNumber } from '~/components/shared/AnimatedNumber';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { ConfirmDialog } from '~/components/shared/ConfirmDialog';
import { DetailHero } from '~/components/shared/DetailHero';
import { DetailPage } from '~/components/shared/DetailPage';
import { EntityAvatar } from '~/components/shared/EntityAvatar';
import { EntityRow } from '~/components/shared/EntityRow';
import { ListGroup, ListRow } from '~/components/shared/ListGroup';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import { OfflineBlock } from '~/components/shared/OfflineBlock';
import { TransactionStatusBadge } from '~/components/shared/TransactionStatusBadge';
import { RefundHistory } from '~/components/transactions/RefundHistory';
import { TransactionItemsSection } from '~/components/transactions/TransactionItemsSection';
import { TransactionPaymentsSection } from '~/components/transactions/TransactionPaymentsSection';
import { TransactionProducts, getTransactionTitle } from '~/components/transactions/TransactionProducts';
import { TransactionTimeline } from '~/components/transactions/TransactionTimeline';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { TRANSACTION_TYPE_BADGE } from '~/config/transactionBadges';
import { useCan } from '~/hooks/useCan';
import { useDeleteEntity } from '~/hooks/useDeleteEntity';
import { useOverlayOps } from '~/hooks/useOfflineOverlay';
import { fmtNum, fmtTJS, formatDate } from '~/lib/format';
import { withPendingPayments } from '~/lib/offline-overlay';
import { buildReceiptText, shareText } from '~/lib/receipt';
import { queryKeys } from '~/lib/query-keys';
import { useTransactionsModals } from '~/routes/(crm)/transactions/store';

export default function TransactionDetailPage() {
  const { t } = useTranslation(['transactions', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { can, user } = useCan();
  const { requestDelete, deleteDialog } = useDeleteEntity({
    entity: 'transactions',
    api: transactionsApi,
    id,
    t,
    redirectTo: '/transactions',
    // Остатки товаров, долги и баланс продавцов считаются по транзакциям — обновляем их кеш тоже.
    alsoInvalidate: ['debtors', 'products', 'sellers'],
  });
  const payModal = useTransactionsModals((s) => s.pay);
  const refundModal = useTransactionsModals((s) => s.refund);

  const {
    data: response,
    isLoading,
    fetchStatus,
  } = useQuery({
    queryKey: queryKeys.full('transactions', id),
    queryFn: () => transactionsApi.getDetail(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const loaded = response?.data;
  // Оплаты, что ещё в очереди, уже вычтены из остатка: на экране и в окне оплаты он такой же, как после отправки.
  const queueOps = useOverlayOps();
  const transaction = useMemo(() => (loaded ? withPendingPayments(loaded, queueOps) : undefined), [loaded, queueOps]);
  // Карточка ни разу не грузилась и сейчас на паузе из-за офлайна — отличаем
  // от "не найдено" (см. app/lib/network-status.ts).
  const isOfflineEmpty = fetchStatus === 'paused' && !transaction;

  if (isLoading) return <ByIdSkeleton />;

  if (isOfflineEmpty) {
    return (
      <OfflineBlock
        label={t('offline.noCachedData', { ns: 'common' })}
        onBack={() => navigate('/transactions')}
        backLabel={t('actions.back', { ns: 'common' })}
      />
    );
  }

  if (!transaction) {
    return (
      <NotFoundBlock
        label={t('notFound')}
        onBack={() => navigate('/transactions')}
        backLabel={t('actions.back', { ns: 'common' })}
      />
    );
  }

  const { summary } = transaction;
  const refundableUnits = transaction.items.reduce((sum, item) => sum + item.refundableQuantity, 0);

  // A partially refunded sale can still be refunded further — the ceiling is
  // what is left on the lines, not the status. Refund rows themselves are
  // never refundable, and neither is anything already fully returned.
  const canRefund =
    can(Action.TRANSACTIONS_REFUND) && transaction.type !== 'REFUND' && !transaction.refundOfId && refundableUnits > 0;

  // Платежи показываем, только если они есть, либо это долг/кредит, где важно
  // отслеживать историю погашений. Для наличной сделки, оплаченной сразу,
  // отдельных платежей нет — пустая панель "нет данных" не нужна.
  const hasPayments = !!transaction.payments && transaction.payments.length > 0;
  const isCredit = transaction.paymentType === 'CREDIT' || transaction.type === 'DEBT' || !!transaction.debtor;
  const showPayments = hasPayments || isCredit;

  const canPay = can(Action.TRANSACTIONS_EDIT) && transaction.remainingAmount > 0;

  // Админ/владелец удаляют любую запись; продавец — только свою свежую запись в долг без платежей
  // (тот же набор условий проверяет бэкенд: 10 минут, свой, DEBT, без оплат).
  const SELLER_CANCEL_MS = 10 * 60 * 1000;
  const sellerCanCancel =
    can(Action.TRANSACTIONS_CANCEL) &&
    transaction.type === 'DEBT' &&
    transaction.createdById === user?.id &&
    !hasPayments &&
    Date.now() - new Date(transaction.createdAt).getTime() < SELLER_CANCEL_MS;
  const canDelete = can(Action.TRANSACTIONS_DELETE) || sellerCanCancel;

  const onShare = async () => {
    const result = await shareText(buildReceiptText(transaction, t));
    if (result === 'copied') toast.success(t('receiptCopied'));
    if (result === 'failed') toast.error(t('receiptFailed'));
  };
  const owed = transaction.remainingAmount > 0;

  const fromState = { fromPath: location.pathname, fromName: t('title') };

  return (
    <>
      <DetailPage
        crumbs={[
          { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
          {
            link: location.state?.fromPath || '/transactions',
            label: location.state?.fromName || t('title'),
          },
          { label: getTransactionTitle(transaction, t) },
        ]}
        hero={
          <DetailHero
            avatar={<TransactionProducts items={transaction.items} size="lg" max={3} />}
            title={getTransactionTitle(transaction, t)}
            subtitle={
              <>
                {formatDate(transaction.createdAt, true)}
                {transaction.dueDate && ` · ${t('fields.dueDate')}: ${formatDate(transaction.dueDate, false)}`}
              </>
            }
            badges={
              <>
                <TransactionStatusBadge status={transaction.status} t={t} />
                <Badge variant="outline" className={TRANSACTION_TYPE_BADGE[transaction.type]}>
                  {t(`type.${transaction.type}`)}
                </Badge>
              </>
            }
            figure={{
              label: owed ? t('fields.remainingAmount') : t('fields.totalAmount'),
              tone: owed ? 'warning' : 'default',
              value: (
                <>
                  <AnimatedNumber
                    value={owed ? transaction.remainingAmount : summary.totalAmount}
                    format={(v) => fmtNum(Math.round(v))}
                  />
                  <span className="text-muted-foreground ml-1.5 text-lg font-semibold">TJS</span>
                </>
              ),
            }}
            actions={
              <>
                {canPay && (
                  <Button size="lg" onClick={() => payModal.open(transaction)}>
                    <CreditCard data-icon="inline-start" />
                    {t('pay')}
                  </Button>
                )}
                {canRefund && (
                  <Button
                    size="lg"
                    variant={canPay ? 'destructive' : 'secondary'}
                    onClick={() => refundModal.open(transaction)}>
                    <Undo2 data-icon="inline-start" />
                    {t('refund')}
                  </Button>
                )}
                <Button size="lg" variant="secondary" onClick={onShare}>
                  <Share2 data-icon="inline-start" />
                  {t('share')}
                </Button>
              </>
            }
            manage={{
              onDelete: canDelete ? requestDelete : undefined,
            }}
          />
        }
        aside={
          <>
            <ListGroup title={t('detail.summary')}>
              <ListRow
                title={t('summary.totalAmount')}
                value={fmtTJS(summary.totalAmount)}
                valueClassName="text-foreground font-semibold"
              />
              <ListRow
                title={t('summary.paidAmount')}
                value={fmtTJS(summary.paidAmount)}
                valueClassName="text-success font-semibold"
              />
              {summary.discountAmount > 0 && (
                <ListRow title={t('summary.discountAmount')} value={fmtTJS(summary.discountAmount)} />
              )}
              <ListRow
                title={t('summary.remainingAmount')}
                value={fmtTJS(summary.remainingAmount)}
                valueClassName={summary.remainingAmount > 0 ? 'text-warning font-semibold' : undefined}
              />
              {summary.refundedAmount > 0 && (
                <>
                  <ListRow
                    title={t('summary.refundedAmount')}
                    value={`−${fmtTJS(summary.refundedAmount)}`}
                    valueClassName="text-destructive font-semibold"
                  />
                  <ListRow
                    title={t('summary.netAmount')}
                    value={fmtTJS(summary.netAmount)}
                    valueClassName="text-foreground font-semibold"
                  />
                </>
              )}
            </ListGroup>

            {transaction.note && (
              <ListGroup title={transaction.type === 'REFUND' ? t('fields.refundReason') : t('fields.note')}>
                <ListRow
                  leading={<StickyNote className="text-muted-foreground size-5" />}
                  title={
                    <span className="text-base font-normal break-words whitespace-pre-wrap">{transaction.note}</span>
                  }
                />
              </ListGroup>
            )}

            <ListGroup>
              <ListRow title={t('fields.paymentType')} value={t(`paymentType.${transaction.paymentType}`)} />
              <ListRow title={t('fields.createdAt')} value={formatDate(transaction.createdAt, true)} />
              <ListRow title={t('fields.updatedAt')} value={formatDate(transaction.updatedAt, true)} />
              {transaction.createdBy && <ListRow title={t('fields.createdBy')} value={transaction.createdBy.name} />}
            </ListGroup>

            {transaction.debtor && (
              <ListGroup title={t('fields.debtor')}>
                <ListRow
                  leading={<EntityAvatar name={transaction.debtor.name} size="sm" />}
                  title={<span className="font-semibold">{transaction.debtor.name}</span>}
                  subtitle={transaction.debtor.phone}
                  to={`/debtors/${transaction.debtor.id}`}
                  state={fromState}
                />
              </ListGroup>
            )}

            {transaction.market && (
              <ListGroup title={t('fields.market', { ns: 'common' })}>
                <EntityRow
                  name={transaction.market.name}
                  subtitle={transaction.market.address ?? undefined}
                  image={transaction.market.image}
                  shape="square"
                  icon={Store}
                  to={`/markets/${transaction.market.id}`}
                  state={fromState}
                />
              </ListGroup>
            )}
          </>
        }>
        <TransactionItemsSection items={transaction.items} totalAmount={summary.totalAmount} t={t} />
        <RefundHistory refundOf={transaction.refundOf} refunds={transaction.refunds} />
        {showPayments && <TransactionPaymentsSection payments={transaction.payments ?? []} t={t} />}
        <TransactionTimeline events={transaction.timeline} currentId={transaction.id} />
      </DetailPage>

      <CreatePaymentModal />
      <RefundTransactionModal />
      <ConfirmDialog {...deleteDialog} />
    </>
  );
}
