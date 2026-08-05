import { useQuery } from '@tanstack/react-query';
import { Pencil, ReceiptText, Store } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { debtorsApi } from '~/api/debtors';
import { transactionsApi } from '~/api/transactions';
import { Panel } from '~/components/layout/Panel';
import { EditDebtorModal } from '~/components/modals/EditDebtorModal';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { DetailHeader } from '~/components/shared/DetailHeader';
import { InfoItem } from '~/components/shared/InfoItem';
import { InfoLink } from '~/components/shared/InfoLink';
import { QuickActions } from '~/components/shared/QuickActions';
import { SkeletonList } from '~/components/shared/SkeletonList';
import { TransactionRow } from '~/components/shared/TransactionRow';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { fmtTJS, formatDate } from '~/lib/format';
import { useDebtorsModals } from '../store';

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
        <DetailHeader
          name={debtor.name}
          subtitle={debtor.phone}
          actions={
            <>
              {can(Action.DEBTORS_EDIT) && (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => editModal.open(debtor)}>
                        <Pencil className="size-3.5" />
                        <span className="hidden sm:inline">{t('actions.edit', { ns: 'common' })}</span>
                      </Button>
                    }
                  />
                  <TooltipContent side="bottom">{t('actions.edit', { ns: 'common' })}</TooltipContent>
                </Tooltip>
              )}
              <div className="text-right">
                <p className="text-muted-foreground text-xs">{t('totalDebt', { defaultValue: 'Текущий долг' })}</p>
                <p className={`font-mono text-xl font-bold ${totalDebt > 0 ? 'text-warning' : 'text-success'}`}>
                  {fmtTJS(totalDebt)}
                </p>
              </div>
            </>
          }
        />
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
              <SkeletonList count={3} />
            ) : transactions.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                {t('noTransactions', { defaultValue: 'Пока нет транзакций' })}
              </p>
            ) : (
              <div className="divide-border divide-y">
                {transactions.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    t={t}
                    to={`/transactions/${tx.id}`}
                    state={{ fromPath: location.pathname, fromName: debtor.name }}
                    showDebtor={false}
                    subtitle={
                      <>
                        {formatDate(tx.createdAt, true)}
                        {tx.dueDate && (
                          <> · {t('fields.dueDate', { ns: 'transactions' })}: {formatDate(tx.dueDate)}</>
                        )}
                      </>
                    }
                  />
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
                    <InfoLink to={`/markets/${debtor.market.id}`} state={{ fromPath: location.pathname, fromName: debtor.name }}>
                      {debtor.market.name}
                    </InfoLink>
                  }
                />
                {debtor.market.address && <InfoItem label={t('fields.address')} value={debtor.market.address} />}
              </div>
            </Panel>
          )}

          <QuickActions
            title={t('quickActions', { defaultValue: 'Быстрые действия' })}
            actions={[
              ...(can(Action.DEBTORS_EDIT)
                ? [
                    {
                      icon: Pencil,
                      label: t('actions.edit', { ns: 'common' }),
                      variant: 'outline' as const,
                      onClick: () => editModal.open(debtor),
                    },
                  ]
                : []),
              {
                icon: ReceiptText,
                label: t('transactionsHistory', { defaultValue: 'Транзакции должника' }),
                render: <Link to="/transactions" state={{ fromDebtorId: debtor.id, fromDebtorName: debtor.name }} />,
              },
              ...(debtor.market
                ? [
                    {
                      icon: Store,
                      label: t('fields.market'),
                      render: <Link to={`/markets/${debtor.market.id}`} />,
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </div>

      <EditDebtorModal />
    </div>
  );
}