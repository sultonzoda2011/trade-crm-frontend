import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, CreditCard, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { transactionsApi } from '~/api/transactions';
import { Panel } from '~/components/layout/Panel';
import { CreatePaymentModal } from '~/components/modals/CreatePaymentModal';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { InfoItem } from '~/components/shared/InfoItem';
import { InfoLink } from '~/components/shared/InfoLink';
import { QuickActions } from '~/components/shared/QuickActions';
import { TransactionStatusBadge } from '~/components/shared/TransactionStatusBadge';
import { Badge } from '~/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { fmtTJS, formatDate } from '~/lib/format';
import { useTransactionsModals } from '../store';

const TYPE_BADGE_CLASS: Record<string, string> = {
  SALE: 'border-success/40 bg-success/15 text-success font-medium',
  DEBT: 'border-warning/40 bg-warning/15 text-warning font-medium',
  REFUND: 'border-destructive/40 bg-destructive/15 text-destructive font-medium',
};

export default function TransactionDetailPage() {
  const { t } = useTranslation(['transactions', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { can } = useCan();
  const payModal = useTransactionsModals((s) => s.pay);

  const { data: response, isLoading } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => transactionsApi.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const { mutate: refund, isPending: isRefunding } = useMutation({
    mutationFn: () => transactionsApi.refund(id!),
    onSuccess: () => {
      toast.success(t('refundSuccess'));
      void queryClient.invalidateQueries({ queryKey: ['transaction', id] });
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: () => toast.error(t('refundError')),
  });

  const transaction = response?.data;

  if (isLoading) return <ByIdSkeleton />;

  if (!transaction) {
    return (
      <div className="flex h-100 flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">{t('notFound')}</p>
        <Button variant="outline" onClick={() => navigate('/transactions')}>
          {t('actions.back', { ns: 'common' })}
        </Button>
      </div>
    );
  }

  const canRefund =
    can(Action.TRANSACTIONS_REFUND) &&
    transaction.type !== 'REFUND' &&
    transaction.status !== 'REFUNDED' &&
    !transaction.refundOfId;

  return (
    <div className="flex flex-1 flex-col space-y-6 pb-8">
      <BreadCrumbs
        items={[
          { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
          {
            link: location.state?.fromPath || '/transactions',
            label: location.state?.fromName || t('title'),
          },
          { label: `#${transaction.id.slice(0, 8)}` },
        ]}
      />

      <Panel className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="font-mono text-lg font-bold">#{transaction.id.slice(0, 8)}</h2>
              <TransactionStatusBadge status={transaction.status} t={t} />
              <Badge
                variant="outline"
                className={
                  TYPE_BADGE_CLASS[transaction.type] ?? 'border-success/40 bg-success/15 text-success font-medium'
                }>
                {t(`type.${transaction.type}`, { defaultValue: transaction.type })}
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

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-muted-foreground text-2xs">{t('fields.remainingAmount')}</p>
              <p className="text-warning font-mono text-base font-bold">{fmtTJS(transaction.remainingAmount)}</p>
            </div>
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
                      disabled={isRefunding}
                      onClick={() => refund()}>
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
                    <th className="px-2.5 py-1.5 text-right">{t('fields.totalPrice')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(transaction.items || []).map((item) => (
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
                      <td className="px-2.5 py-2 text-right font-mono font-semibold">
                        {fmtTJS(item.totalPrice || item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-border border-t">
                  <tr>
                    <td
                      colSpan={3}
                      className="text-muted-foreground px-2.5 py-2 text-right text-xs font-medium uppercase">
                      {t('fields.totalPrice')}
                    </td>
                    <td className="px-2.5 py-2 text-right font-mono text-sm font-semibold">
                      {fmtTJS(
                        (transaction.items || []).reduce(
                          (sum, item) => sum + (item.totalPrice || item.price * item.quantity),
                          0
                        )
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Panel>

          <Panel title={t('fields.payments')}>
            {transaction.payments && transaction.payments.length > 0 ? (
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
        </div>

        <div className="space-y-3">
          <Panel title={t('fields.id')} className="p-3">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              <InfoItem label={t('fields.totalAmount')} value={fmtTJS(transaction.totalAmount)} />
              <InfoItem label={t('fields.remainingAmount')} value={fmtTJS(transaction.remainingAmount)} />
              {transaction.discountAmount > 0 && (
                <InfoItem label={t('fields.discount')} value={fmtTJS(transaction.discountAmount)} />
              )}
              <InfoItem
                label={t('fields.paymentType')}
                value={t(`paymentType.${transaction.paymentType}`, { defaultValue: transaction.paymentType })}
              />
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
            <Panel title={t('fields.market')} className="p-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-10 shrink-0 rounded-lg">
                  {transaction.market.image ? (
                    <AvatarImage src={transaction.market.image} alt={transaction.market.name} />
                  ) : null}
                  <AvatarFallback className="bg-muted rounded-lg">
                    {transaction.market.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <InfoLink
                    to={`/markets/${transaction.market.id}`}
                    state={{ fromPath: location.pathname, fromName: t('title') }}>
                    {transaction.market.name}
                  </InfoLink>
                  {transaction.market.address && (
                    <p className="text-muted-foreground truncate text-xs">{transaction.market.address}</p>
                  )}
                </div>
              </div>
            </Panel>
          )}

          <QuickActions
            title={t('quickActions', { defaultValue: 'Быстрые действия' })}
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
                      disabled: isRefunding,
                      onClick: () => refund(),
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
    </div>
  );
}
