import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Pencil, ReceiptText, Store } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { debtorsApi } from '~/api/debtors';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { transactionsApi } from '~/api/transactions';
import { Panel } from '~/components/layout/Panel';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { InfoItem } from '~/components/shared/InfoItem';
import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { fmtTJS, formatDate } from '~/lib/format';
import { useDebtorsModals } from '../store';
import { EditDebtorModal } from '~/components/modals/EditDebtorModal';

export default function DebtorDetailPage() {
  const { t } = useTranslation(['debtors', 'transactions', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useCan();
  const editModal = useDebtorsModals((s) => s.edit);

  const { data: response, isLoading } = useQuery({
    queryKey: ['debtor', id],
    queryFn: () => debtorsApi.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  // Бэкенд в detail-ответе должника отдаёт только _count.transactions, без самого
  // списка и без суммы долга — поэтому тянем транзакции этого должника отдельным
  // запросом (тот же ресурс, что и на странице /transactions, с фильтром debtorId).
  const { data: txResponse, isLoading: isTxLoading } = useQuery({
    queryKey: ['debtor-transactions', id],
    queryFn: () => transactionsApi.getAll(1, 50, {}, [{ key: 'debtorId', value: id! }]),
    enabled: !!id,
    staleTime: 30_000,
  });

  const debtor = response?.data;
  const transactions = txResponse?.data?.data ?? [];

  const totalDebt = useMemo(
    () => transactions.reduce((sum, tx) => sum + (tx.type === 'DEBT' ? tx.remainingAmount : 0), 0),
    [transactions],
  );

  if (isLoading) return <ByIdSkeleton />;

  if (!debtor) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">{t('notFound')}</p>
        <Button variant="outline" onClick={() => navigate('/debtors')}>
          {t('actions.back', { ns: 'common' })}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col space-y-6 pb-8">
      <BreadCrumbs
        items={[
          { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
          { link: location.state?.fromPath, label: location.state?.fromName || t('navigation.debtors', { ns: 'common' }) },
          { label: debtor.name },
        ]}
      />

      <Panel className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <Avatar className="size-16 rounded-xl">
              <AvatarFallback className="bg-muted rounded-xl text-2xl font-semibold">
                {debtor.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1.5">
              <h1 className="text-xl font-bold tracking-tight">{debtor.name}</h1>
              <p className="text-muted-foreground text-sm">{debtor.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {can(Action.DEBTORS_EDIT) && (
              <Tooltip>
                <TooltipTrigger render={
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => editModal.open(debtor)}>
                    <Pencil className="size-3.5" />
                    <span className="hidden sm:inline">{t('actions.edit', { ns: 'common' })}</span>
                  </Button>
                } />
                <TooltipContent side="bottom">{t('actions.edit', { ns: 'common' })}</TooltipContent>
              </Tooltip>
            )}
            <div className="text-right">
              <p className="text-muted-foreground text-xs">{t('totalDebt', { defaultValue: 'Текущий долг' })}</p>
              <p className={`font-mono text-xl font-bold ${totalDebt > 0 ? 'text-warning' : 'text-success'}`}>
                {fmtTJS(totalDebt)}
              </p>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InfoItem label={t('fields.name')} value={debtor.name} />
              <InfoItem label={t('fields.phone')} value={debtor.phone} />
              <InfoItem label={t('fields.createdAt')} value={formatDate(debtor.createdAt, true)} />
              <InfoItem label={t('fields.updatedAt')} value={formatDate(debtor.updatedAt, true)} />
              <InfoItem label={t('fields.transactions')} value={debtor._count.transactions.toLocaleString()} />
            </div>
          </Panel>

          <Panel title={t('transactionsHistory', { defaultValue: 'История транзакций' })}>
            {isTxLoading ? (
              <div className="space-y-2 py-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-muted/50 h-14 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                {t('noTransactions', { defaultValue: 'Пока нет транзакций' })}
              </p>
            ) : (
              <div className="divide-y divide-border">
                {transactions.map((tx) => (
                  <Link
                    key={tx.id}
                    to={`/transactions/${tx.id}`}
                    state={{ fromPath: location.pathname, fromName: debtor.name }}
                    className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-3 transition-colors hover:bg-muted/40">
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
                        {tx.dueDate && <> · {t('fields.dueDate', { ns: 'transactions' })}: {formatDate(tx.dueDate)}</>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-semibold">{fmtTJS(tx.totalAmount)}</p>
                      {tx.remainingAmount > 0 && (
                        <p className="font-mono text-xs text-warning">
                          {t('fields.remainingAmount', { ns: 'transactions' })}: {fmtTJS(tx.remainingAmount)}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          {debtor.market && (
            <Panel title={t('fields.market')}>
              <div className="space-y-4">
                <InfoItem
                  label={t('fields.name')}
                  value={
                    <Link
                      to={`/markets/${debtor.market.id}`}
                      className="group text-primary inline-flex items-center gap-1 text-sm font-semibold hover:underline">
                      {debtor.market.name}
                      <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  }
                />
                {debtor.market.address && <InfoItem label={t('fields.address')} value={debtor.market.address} />}
              </div>
            </Panel>
          )}

          <Panel title={t('quickActions', { defaultValue: 'Быстрые действия' })}>
            <div className="space-y-2">
              {can(Action.DEBTORS_EDIT) && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  size="sm"
                  onClick={() => editModal.open(debtor)}>
                  <Pencil className="size-3.5" />
                  {t('actions.edit', { ns: 'common' })}
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                size="sm"
                render={<Link to="/transactions" state={{ fromDebtorId: debtor.id, fromDebtorName: debtor.name }} />}>
                <ReceiptText className="size-3.5" />
                {t('transactionsHistory', { defaultValue: 'Транзакции должника' })}
              </Button>
              {debtor.market && (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  size="sm"
                  render={<Link to={`/markets/${debtor.market.id}`} />}>
                  <Store className="size-3.5" />
                  {t('fields.market')}
                </Button>
              )}
            </div>
          </Panel>
        </div>
      </div>

      <EditDebtorModal />
    </div>
  );
}
