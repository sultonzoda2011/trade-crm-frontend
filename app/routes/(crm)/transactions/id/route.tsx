import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, CreditCard, Pencil, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { transactionsApi } from '~/api/transactions';
import { Panel } from '~/components/layout/Panel';
import { CreatePaymentModal } from '~/components/modals/CreatePaymentModal';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { InfoItem } from '~/components/shared/InfoItem';
import { Badge } from '~/components/ui/badge';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { fmtTJS, formatDate } from '~/lib/format';
import { useTransactionsModals } from '../store';

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

  let statusBadgeClass = 'bg-muted text-muted-foreground';
  if (transaction.status === 'ACTIVE') statusBadgeClass = 'bg-warning/15 text-warning border-warning/30';
  if (transaction.status === 'PARTIAL') statusBadgeClass = 'bg-sky-500/15 text-sky-500 border-sky-500/30';
  if (transaction.status === 'PAID') statusBadgeClass = 'bg-success/15 text-success border-success/30';
  if (transaction.status === 'REFUNDED') statusBadgeClass = 'bg-destructive/15 text-destructive border-destructive/30';

  let typeBadgeClass = 'border-success/40 bg-success/15 text-success font-medium';
  if (transaction.type === 'DEBT') typeBadgeClass = 'border-warning/40 bg-warning/15 text-warning font-medium';
  if (transaction.type === 'REFUND') typeBadgeClass = 'border-destructive/40 bg-destructive/15 text-destructive font-medium';

  // Возврат доступен только для исходной SALE/DEBT-транзакции, которую ещё не
  // возвращали, и только у ролей с правом TRANSACTIONS_REFUND.
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

      <Panel className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold font-mono">#{transaction.id.slice(0, 8)}</h2>
              <Badge variant="outline" className={`font-medium ${statusBadgeClass}`}>
                {t(`status.${transaction.status}`, { defaultValue: transaction.status })}
              </Badge>
              <Badge variant="outline" className={typeBadgeClass}>
                {t(`type.${transaction.type}`, { defaultValue: transaction.type })}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs">
              {t('fields.createdAt')}: {formatDate(transaction.createdAt, true)}
              {transaction.dueDate && (
                <> · {t('fields.dueDate')}: {formatDate(transaction.dueDate, false)}</>
              )}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-muted-foreground text-xs">{t('fields.remainingAmount')}</p>
              <p className="font-mono text-lg font-bold text-warning">{fmtTJS(transaction.remainingAmount)}</p>
            </div>
            {can(Action.TRANSACTIONS_EDIT) && (
              <Tooltip>
                <TooltipTrigger render={
                  <Button onClick={() => payModal.open(transaction)} className="gap-2" disabled={transaction.remainingAmount <= 0}>
                    <CreditCard className="h-4 w-4" />
                    {t('pay')}
                  </Button>
                } />
                <TooltipContent side="bottom">{t('pay')}</TooltipContent>
              </Tooltip>
            )}
            {canRefund && (
              <Tooltip>
                <TooltipTrigger render={
                  <Button
                    variant="outline"
                    className="gap-2 text-destructive hover:bg-destructive/10"
                    disabled={isRefunding}
                    onClick={() => refund()}>
                    <Undo2 className="h-4 w-4" />
                    {t('refund')}
                  </Button>
                } />
                <TooltipContent side="bottom">{t('refund')}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title={t('fields.items')}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 px-3">{t('fields.product')}</th>
                    <th className="py-2 px-3 text-right">{t('fields.price')}</th>
                    <th className="py-2 px-3 text-center">{t('fields.quantity')}</th>
                    <th className="py-2 px-3 text-right">{t('fields.totalPrice')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(transaction.items || []).map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 px-3 font-medium">
                        <Link
                          to={`/products/${item.productId}`}
                          className="hover:underline text-primary">
                          {item.productName || item.product?.name || item.productId}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">{fmtTJS(item.price)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold">
                        {fmtTJS(item.totalPrice || item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={t('fields.payments')}>
            {transaction.payments && transaction.payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="py-2 px-3">{t('fields.amount')}</th>
                      <th className="py-2 px-3">{t('fields.note')}</th>
                      <th className="py-2 px-3">{t('fields.createdBy')}</th>
                      <th className="py-2 px-3 text-right">{t('fields.createdAt')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transaction.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2.5 px-3 font-mono font-semibold text-success">
                          +{fmtTJS(p.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">{p.note || '-'}</td>
                        <td className="py-2.5 px-3">{p.createdBy?.name || '-'}</td>
                        <td className="py-2.5 px-3 text-right text-xs text-muted-foreground">
                          {formatDate(p.createdAt, true)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-4 text-center">
                {t('table.noData', { ns: 'common' })}
              </p>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title={t('fields.id')}>
            <div className="space-y-4">
              <InfoItem label={t('fields.totalAmount')} value={fmtTJS(transaction.totalAmount)} />
              <InfoItem label={t('fields.remainingAmount')} value={fmtTJS(transaction.remainingAmount)} />
              <InfoItem
                label={t('fields.paymentType')}
                value={t(`paymentType.${transaction.paymentType}`, { defaultValue: transaction.paymentType })}
              />
              {transaction.createdBy && (
                <InfoItem label={t('fields.createdBy')} value={transaction.createdBy.name} />
              )}
              <InfoItem label={t('fields.createdAt')} value={formatDate(transaction.createdAt, true)} />
              <InfoItem label={t('fields.updatedAt')} value={formatDate(transaction.updatedAt, true)} />
            </div>
          </Panel>

          {transaction.debtor && (
            <Panel title={t('fields.debtor')}>
              <div className="space-y-4">
                <InfoItem
                  label={t('fields.debtor')}
                  value={
                    <Link
                      to={`/debtors/${transaction.debtor.id}`}
                      className="group text-primary inline-flex items-center gap-1 text-sm font-semibold hover:underline">
                      {transaction.debtor.name}
                      <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  }
                />
                {transaction.debtor.phone && (
                  <InfoItem label={t('fields.phone', { ns: 'common' })} value={transaction.debtor.phone} />
                )}
              </div>
            </Panel>
          )}

          {transaction.market && (
            <Panel title={t('fields.market')}>
              <div className="space-y-4">
                <InfoItem
                  label={t('fields.market')}
                  value={
                    <Link
                      to={`/markets/${transaction.market.id}`}
                      className="group text-primary inline-flex items-center gap-1 text-sm font-semibold hover:underline">
                      {transaction.market.name}
                      <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  }
                />
                {transaction.market.address && (
                  <InfoItem label={t('fields.address', { ns: 'common' })} value={transaction.market.address} />
                )}
              </div>
            </Panel>
          )}

          <Panel title={t('quickActions', { defaultValue: 'Быстрые действия' })}>
            <div className="space-y-2">
              {transaction.remainingAmount > 0 && can(Action.TRANSACTIONS_EDIT) && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  size="sm"
                  onClick={() => payModal.open(transaction)}>
                  <CreditCard className="size-3.5" />
                  {t('pay')}
                </Button>
              )}
              {canRefund && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10"
                  size="sm"
                  disabled={isRefunding}
                  onClick={() => refund()}>
                  <Undo2 className="size-3.5" />
                  {t('refund')}
                </Button>
              )}
              {transaction.debtor && (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  size="sm"
                  render={<Link to={`/debtors/${transaction.debtor.id}`} />}>
                  <ArrowUpRight className="size-3.5" />
                  {t('fields.debtor')}
                </Button>
              )}
            </div>
          </Panel>
        </div>
      </div>

      <CreatePaymentModal />
    </div>
  );
}
