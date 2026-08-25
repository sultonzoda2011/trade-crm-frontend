import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, CreditCard, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { transactionsApi } from '~/api/transactions';
import { Panel } from '~/components/layout/Panel';
import { CreatePaymentModal } from '~/components/modals/CreatePaymentModal';
import { RefundTransactionModal } from '~/components/modals/RefundTransactionModal';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import { InfoItem } from '~/components/shared/InfoItem';
import { MarketCard } from '~/components/shared/MarketCard';
import { InfoLink } from '~/components/shared/InfoLink';
import { QuickActions } from '~/components/shared/QuickActions';
import { TransactionStatusBadge } from '~/components/shared/TransactionStatusBadge';
import { TransactionTimeline } from '~/components/transactions/TransactionTimeline';
import { TransactionProducts, getTransactionTitle } from '~/components/transactions/TransactionProducts';
import { RefundHistory } from '~/components/transactions/RefundHistory';
import { Badge } from '~/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { Action } from '~/config/actions';
import { TRANSACTION_TYPE_BADGE } from '~/config/transactionBadges';
import { useCan } from '~/hooks/useCan';
import { fmtTJS, formatDate } from '~/lib/format';
import { useTransactionsModals } from '~/routes/(crm)/transactions/store';

export default function TransactionDetailPage() {
  const { t } = useTranslation(['transactions', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useCan();
  const payModal = useTransactionsModals((s) => s.pay);
  const refundModal = useTransactionsModals((s) => s.refund);

  const { data: response, isLoading } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => transactionsApi.getDetail(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const transaction = response?.data;

  if (isLoading) return <ByIdSkeleton />;

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
    can(Action.TRANSACTIONS_REFUND) &&
    transaction.type !== 'REFUND' &&
    !transaction.refundOfId &&
    refundableUnits > 0;

  // Платежи показываем, только если они есть, либо это долг/кредит, где важно
  // отслеживать историю погашений. Для наличной сделки, оплаченной сразу,
  // отдельных платежей нет — пустая панель "нет данных" не нужна.
  const hasPayments = !!transaction.payments && transaction.payments.length > 0;
  const isCredit = transaction.paymentType === 'CREDIT' || transaction.type === 'DEBT' || !!transaction.debtor;
  const showPayments = hasPayments || isCredit;

  return (
    <div className="flex flex-1 flex-col space-y-6 pb-8">
      <BreadCrumbs
        items={[
          { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
          {
            link: location.state?.fromPath || '/transactions',
            label: location.state?.fromName || t('title'),
          },
          { label: getTransactionTitle(transaction, t) },
        ]}
      />

      <Panel className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <TransactionProducts items={transaction.items} size="lg" max={4} />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-lg font-bold">{getTransactionTitle(transaction, t)}</h2>
                <TransactionStatusBadge status={transaction.status} t={t} />
                <Badge variant="outline" className={TRANSACTION_TYPE_BADGE[transaction.type]}>
                  {t(`type.${transaction.type}`)}
                </Badge>
              </div>
              <p className="text-muted-foreground text-2xs">
                {t('fields.createdAt')}: {formatDate(transaction.createdAt, true)}
                {transaction.dueDate && (
                  <>
                    {' '}
                    · {t('fields.dueDate')}: {formatDate(transaction.dueDate, false)}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* На узких экранах сумма остатка и кнопки не помещаются в один ряд —
              переносим кнопки на новую строку и даём им растягиваться. */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-left sm:text-right">
              <p className="text-muted-foreground text-2xs">{t('fields.remainingAmount')}</p>
              <p className="text-warning font-mono text-base font-bold">{fmtTJS(transaction.remainingAmount)}</p>
            </div>
            <div className="flex flex-1 flex-wrap justify-end gap-2 sm:flex-none">
              {can(Action.TRANSACTIONS_EDIT) && (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        size="sm"
                        onClick={() => payModal.open(transaction)}
                        className="gap-2"
                        disabled={transaction.remainingAmount <= 0}>
                        <CreditCard className="size-4" />
                        {t('pay')}
                      </Button>
                    }
                  />
                  <TooltipContent side="bottom">{t('pay')}</TooltipContent>
                </Tooltip>
              )}
              {canRefund && (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 gap-2"
                        onClick={() => refundModal.open(transaction)}>
                        <Undo2 className="size-4" />
                        {t('refund')}
                      </Button>
                    }
                  />
                  <TooltipContent side="bottom">{t('refund')}</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <Panel
            title={t('fields.items')}
            actions={
              <Badge variant="secondary" className="text-xs font-normal">
                {transaction.items?.length ?? 0}
              </Badge>
            }>
            <div className="scrollbar-thin max-h-64 overflow-x-auto overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-muted-foreground bg-sidebar sticky top-0 z-10 border-b text-xs uppercase">
                  <tr>
                    <th className="px-2.5 py-1.5">{t('fields.product')}</th>
                    <th className="px-2.5 py-1.5 text-right">{t('fields.price')}</th>
                    <th className="px-2.5 py-1.5 text-center">{t('fields.quantity')}</th>
                    <th className="px-2.5 py-1.5 text-center">{t('fieldsRefund.refundedQuantity')}</th>
                    <th className="px-2.5 py-1.5 text-right">{t('fields.totalPrice')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transaction.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-2.5 py-2 font-medium">
                        <span className="flex items-center gap-2">
                          <Avatar size="sm" className="shrink-0">
                            {item.product?.image ? (
                              <AvatarImage src={item.product.image} alt={item.productName} />
                            ) : null}
                            <AvatarFallback>
                              {(item.productName || item.product?.name || '?').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <Link to={`/products/${item.productId}`} className="text-primary hover:underline">
                            {item.productName || item.product?.name || item.productId}
                          </Link>
                        </span>
                      </td>
                      <td className="px-2.5 py-2 text-right font-mono">{fmtTJS(item.price)}</td>
                      <td className="px-2.5 py-2 text-center font-mono">{item.quantity}</td>
                      <td className="px-2.5 py-2 text-center font-mono">
                        {item.refundedQuantity > 0 ? (
                          <span className="text-destructive font-semibold">−{item.refundedQuantity}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-2.5 py-2 text-right font-mono font-semibold">
                        {fmtTJS(item.totalPrice || item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-border border-t">
                  <tr>
                    <td
                      colSpan={4}
                      className="text-muted-foreground px-2.5 py-2 text-right text-xs font-medium uppercase">
                      {t('fields.totalPrice')}
                    </td>
                    <td className="px-2.5 py-2 text-right font-mono text-sm font-semibold">
                      {fmtTJS(summary.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Panel>

          <RefundHistory refundOf={transaction.refundOf} refunds={transaction.refunds} />

          <TransactionTimeline events={transaction.timeline} currentId={transaction.id} />

          {showPayments && (
            <Panel title={t('fields.payments')}>
              {hasPayments ? (
              <div className="scrollbar-thin max-h-64 overflow-x-auto overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-muted-foreground bg-sidebar sticky top-0 z-10 border-b text-xs uppercase">
                    <tr>
                      <th className="px-2.5 py-1.5">{t('fields.amount')}</th>
                      <th className="px-2.5 py-1.5">{t('fields.note')}</th>
                      <th className="px-2.5 py-1.5">{t('fields.createdBy')}</th>
                      <th className="px-2.5 py-1.5 text-right">{t('fields.createdAt')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transaction.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="text-success px-2.5 py-2 font-mono font-semibold">+{fmtTJS(p.amount)}</td>
                        <td className="text-muted-foreground px-2.5 py-2">{p.note || '-'}</td>
                        <td className="px-2.5 py-2">
                          <span className="flex items-center gap-2">
                            <Avatar size="sm" className="shrink-0">
                              {p.createdBy?.image ? (
                                <AvatarImage src={p.createdBy.image} alt={p.createdBy.name} />
                              ) : null}
                              <AvatarFallback>{(p.createdBy?.name ?? '?').charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="truncate">{p.createdBy?.name || '-'}</span>
                          </span>
                        </td>
                        <td className="text-muted-foreground px-2.5 py-2 text-right text-xs">
                          {formatDate(p.createdAt, true)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground py-3 text-center text-sm">{t('table.noData', { ns: 'common' })}</p>
              )}
            </Panel>
          )}
        </div>

        <div className="space-y-3">
          <Panel title={t('detail.summary')} className="p-3">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              <InfoItem label={t('summary.totalAmount')} value={fmtTJS(summary.totalAmount)} />
              <InfoItem
                label={t('summary.paidAmount')}
                value={<span className="text-success font-mono">{fmtTJS(summary.paidAmount)}</span>}
              />
              {summary.discountAmount > 0 && (
                <InfoItem label={t('summary.discountAmount')} value={fmtTJS(summary.discountAmount)} />
              )}
              <InfoItem
                label={t('summary.remainingAmount')}
                value={<span className="text-warning font-mono">{fmtTJS(summary.remainingAmount)}</span>}
              />
              {summary.refundedAmount > 0 && (
                <>
                  <InfoItem
                    label={t('summary.refundedAmount')}
                    value={<span className="text-destructive font-mono">−{fmtTJS(summary.refundedAmount)}</span>}
                  />
                  <InfoItem
                    label={t('summary.netAmount')}
                    value={<span className="font-mono font-semibold">{fmtTJS(summary.netAmount)}</span>}
                  />
                </>
              )}
            </div>
          </Panel>

          <Panel title={t('details')} className="p-3">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              <InfoItem label={t('fields.paymentType')} value={t(`paymentType.${transaction.paymentType}`)} />
              <InfoItem label={t('fields.createdAt')} value={formatDate(transaction.createdAt, true)} />
              <InfoItem label={t('fields.updatedAt')} value={formatDate(transaction.updatedAt, true)} />
              {transaction.createdBy && (
                <div className="col-span-2">
                  <InfoItem
                    label={t('fields.createdBy')}
                    value={
                      <span className="flex items-center gap-2">
                        <Avatar size="sm" className="shrink-0">
                          {transaction.createdBy.image ? (
                            <AvatarImage src={transaction.createdBy.image} alt={transaction.createdBy.name} />
                          ) : null}
                          <AvatarFallback>{transaction.createdBy.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="truncate">{transaction.createdBy.name}</span>
                      </span>
                    }
                  />
                </div>
              )}
            </div>
          </Panel>
          {transaction.debtor && (
            <Panel title={t('fields.debtor')} className="p-3">
              <div className="space-y-2.5">
                <InfoItem
                  label={t('fields.debtor')}
                  value={
                    <InfoLink
                      to={`/debtors/${transaction.debtor.id}`}
                      state={{ fromPath: location.pathname, fromName: t('title') }}>
                      {transaction.debtor.name}
                    </InfoLink>
                  }
                />
                {transaction.debtor.phone && (
                  <InfoItem label={t('fields.phone', { ns: 'common' })} value={transaction.debtor.phone} />
                )}
              </div>
            </Panel>
          )}

          {transaction.market && (
            <MarketCard
              market={transaction.market}
              t={t}
              viewState={{ fromPath: location.pathname, fromName: t('title') }}
              className="p-3"
            />
          )}

          <QuickActions
            title={t('quickActions')}
            actions={[
              ...(transaction.remainingAmount > 0 && can(Action.TRANSACTIONS_EDIT)
                ? [
                    {
                      icon: CreditCard,
                      label: t('pay'),
                      variant: 'outline' as const,
                      onClick: () => payModal.open(transaction),
                    },
                  ]
                : []),
              ...(canRefund
                ? [
                    {
                      icon: Undo2,
                      label: t('refund'),
                      variant: 'outline' as const,
                      className: 'text-destructive hover:bg-destructive/10',
                      onClick: () => refundModal.open(transaction),
                    },
                  ]
                : []),
              ...(transaction.debtor
                ? [
                    {
                      icon: ArrowUpRight,
                      label: t('fields.debtor'),
                      render: <Link to={`/debtors/${transaction.debtor.id}`} />,
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </div>

      <CreatePaymentModal />
      <RefundTransactionModal />
    </div>
  );
}
