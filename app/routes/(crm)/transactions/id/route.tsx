import { useQuery } from '@tanstack/react-query';
import { CreditCard, Package, Store, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { transactionsApi } from '~/api/transactions';
import { CreatePaymentModal } from '~/components/modals/CreatePaymentModal';
import { RefundTransactionModal } from '~/components/modals/RefundTransactionModal';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { AnimatedNumber } from '~/components/shared/AnimatedNumber';
import { DetailHero } from '~/components/shared/DetailHero';
import { DetailPage } from '~/components/shared/DetailPage';
import { EntityAvatar } from '~/components/shared/EntityAvatar';
import { EntityRow } from '~/components/shared/EntityRow';
import { ListEmpty, ListGroup, ListRow } from '~/components/shared/ListGroup';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import { OfflineBlock } from '~/components/shared/OfflineBlock';
import { TransactionStatusBadge } from '~/components/shared/TransactionStatusBadge';
import { RefundHistory } from '~/components/transactions/RefundHistory';
import { TransactionProducts, getTransactionTitle } from '~/components/transactions/TransactionProducts';
import { TransactionTimeline } from '~/components/transactions/TransactionTimeline';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { TRANSACTION_TYPE_BADGE } from '~/config/transactionBadges';
import { useCan } from '~/hooks/useCan';
import { cldThumb } from '~/lib/cloudinary';
import { fmtNum, fmtTJS, formatDate } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';
import { useTransactionsModals } from '~/routes/(crm)/transactions/store';

export default function TransactionDetailPage() {
  const { t } = useTranslation(['transactions', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useCan();
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

  const transaction = response?.data;
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
              canPay || canRefund ? (
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
                </>
              ) : undefined
            }
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
        <ListGroup title={`${t('fields.items')} · ${transaction.items?.length ?? 0}`}>
          {transaction.items.map((item) => (
            <Link
              key={item.id}
              to={`/products/${item.productId}`}
              className="active:bg-muted/70 flex min-h-16 items-center gap-3 px-4 py-3 md:hidden">
              <span className="bg-muted flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[10px]">
                {item.product?.image ? (
                  <img src={cldThumb(item.product.image, { w: 88, h: 88 })} alt="" className="size-full object-cover" />
                ) : (
                  <Package className="text-muted-foreground size-5" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 block text-base leading-snug font-semibold">
                  {item.productName || item.product?.name || item.productId}
                </span>
                <span className="text-muted-foreground block text-sm leading-snug">
                  {fmtNum(item.price)} × {item.quantity}
                  {item.refundedQuantity > 0 && (
                    <span className="text-destructive font-medium">
                      {' '}
                      · −{item.refundedQuantity} {t('fieldsRefund.refundedQuantity')}
                    </span>
                  )}
                </span>
              </span>
              <span className="shrink-0 font-mono text-base font-semibold">
                {fmtNum(item.totalPrice || item.price * item.quantity)}
              </span>
            </Link>
          ))}
          <div className="flex min-h-12 items-center justify-between px-4 py-2.5 md:hidden">
            <span className="text-muted-foreground text-base">{t('fields.totalPrice')}</span>
            <span className="font-mono text-lg font-bold">{fmtTJS(summary.totalAmount)}</span>
          </div>

          <div className="scrollbar-thin hidden max-h-72 overflow-x-auto overflow-y-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground bg-card sticky top-0 z-10 border-b text-xs">
                <tr>
                  <th className="px-4 py-2.5 font-medium">{t('fields.product')}</th>
                  <th className="px-3 py-2.5 text-right font-medium">{t('fields.price')}</th>
                  <th className="px-3 py-2.5 text-center font-medium">{t('fields.quantity')}</th>
                  <th className="px-3 py-2.5 text-center font-medium">{t('fieldsRefund.refundedQuantity')}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t('fields.totalPrice')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transaction.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2.5 font-medium">
                      <span className="flex items-center gap-2">
                        <Avatar size="sm" className="shrink-0">
                          {item.product?.image ? <AvatarImage src={item.product.image} alt={item.productName} /> : null}
                          <AvatarFallback>
                            {(item.productName || item.product?.name || '?').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <Link to={`/products/${item.productId}`} className="text-primary hover:underline">
                          {item.productName || item.product?.name || item.productId}
                        </Link>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">{fmtTJS(item.price)}</td>
                    <td className="px-3 py-2.5 text-center font-mono">{item.quantity}</td>
                    <td className="px-3 py-2.5 text-center font-mono">
                      {item.refundedQuantity > 0 ? (
                        <span className="text-destructive font-semibold">−{item.refundedQuantity}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold">
                      {fmtTJS(item.totalPrice || item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-border border-t">
                <tr>
                  <td colSpan={4} className="text-muted-foreground px-4 py-2.5 text-right text-xs font-medium">
                    {t('fields.totalPrice')}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm font-semibold">
                    {fmtTJS(summary.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </ListGroup>

        <RefundHistory refundOf={transaction.refundOf} refunds={transaction.refunds} />

        {showPayments && (
          <ListGroup title={t('fields.payments')}>
            {hasPayments ? (
              <>
                {transaction.payments.map((p) => (
                  <div key={p.id} className="flex min-h-14 items-center gap-3 px-4 py-2.5 md:hidden">
                    <EntityAvatar name={p.createdBy?.name ?? '?'} image={p.createdBy?.image} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="text-base leading-snug font-medium break-words">{p.createdBy?.name || '-'}</p>
                      <p className="text-muted-foreground text-sm leading-snug break-words">
                        {formatDate(p.createdAt, true)}
                        {p.note && ` · ${p.note}`}
                      </p>
                    </div>
                    <span className="text-success shrink-0 font-mono text-base font-semibold">+{fmtNum(p.amount)}</span>
                  </div>
                ))}
                <div className="scrollbar-thin hidden max-h-72 overflow-x-auto overflow-y-auto md:block">
                  <table className="w-full text-left text-sm">
                    <thead className="text-muted-foreground bg-card sticky top-0 z-10 border-b text-xs">
                      <tr>
                        <th className="px-4 py-2.5 font-medium">{t('fields.amount')}</th>
                        <th className="px-3 py-2.5 font-medium">{t('fields.note')}</th>
                        <th className="px-3 py-2.5 font-medium">{t('fields.createdBy')}</th>
                        <th className="px-4 py-2.5 text-right font-medium">{t('fields.createdAt')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {transaction.payments.map((p) => (
                        <tr key={p.id}>
                          <td className="text-success px-4 py-2.5 font-mono font-semibold">+{fmtTJS(p.amount)}</td>
                          <td className="text-muted-foreground px-3 py-2.5">{p.note || '-'}</td>
                          <td className="px-3 py-2.5">
                            <span className="flex items-center gap-2">
                              <Avatar size="sm" className="shrink-0">
                                {p.createdBy?.image ? (
                                  <AvatarImage src={p.createdBy.image} alt={p.createdBy.name} />
                                ) : null}
                                <AvatarFallback>{(p.createdBy?.name ?? '?').charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="break-words">{p.createdBy?.name || '-'}</span>
                            </span>
                          </td>
                          <td className="text-muted-foreground px-4 py-2.5 text-right text-xs">
                            {formatDate(p.createdAt, true)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <ListEmpty>{t('table.noData', { ns: 'common' })}</ListEmpty>
            )}
          </ListGroup>
        )}

        <TransactionTimeline events={transaction.timeline} currentId={transaction.id} />
      </DetailPage>

      <CreatePaymentModal />
      <RefundTransactionModal />
    </>
  );
}
