import { useQuery } from '@tanstack/react-query';
import { Pencil, ReceiptText, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { debtorsApi } from '~/api/debtors';
import { transactionsApi } from '~/api/transactions';
import { Panel } from '~/components/layout/Panel';
import { EditDebtorModal } from '~/components/modals/EditDebtorModal';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import { DetailHeader } from '~/components/shared/DetailHeader';
import { InfoItem } from '~/components/shared/InfoItem';
import { MarketCard } from '~/components/shared/MarketCard';
import { QuickActions } from '~/components/shared/QuickActions';
import { SkeletonList } from '~/components/shared/SkeletonList';
import { TransactionRow } from '~/components/shared/TransactionRow';
import { Badge } from '~/components/ui/badge';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { Action } from '~/config/actions';
import { DEBTOR_RISK_BADGE } from '~/config/analyticsBadges';
import { useCan } from '~/hooks/useCan';
import { fmtTJS, formatDate } from '~/lib/format';
import { useDebtorsModals } from '~/routes/(crm)/debtors/store';

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

  return (
    <div className="flex flex-1 flex-col space-y-6 pb-8">
      <BreadCrumbs
        items={[
          { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
          {
            link: location.state?.fromPath,
            label: location.state?.fromName || t('navigation.debtors', { ns: 'common' }),
          },
          { label: debtor.name },
        ]}
      />

      <Panel className="p-6">
        <DetailHeader
          name={debtor.name}
          subtitle={debtor.phone}
          badges={
            <Badge variant="outline" className={DEBTOR_RISK_BADGE[debtor.risk]}>
              {t(`risk.${debtor.risk}`)}
            </Badge>
          }
          actions={
            <>
              <div className="text-left sm:text-right">
                <p className="text-muted-foreground text-xs">{t('totalDebt')}</p>
                <p className={`font-mono text-xl font-bold ${debtor.totalDebtAmount > 0 ? 'text-warning' : 'text-success'}`}>
                  {fmtTJS(debtor.totalDebtAmount)}
                </p>
              </div>
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

          <Panel title={t('totalDebtAmount')}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <InfoItem label={t('profile.activeDebtCount')} value={debtor.activeDebtCount} />
              <InfoItem
                label={t('profile.overdueAmount')}
                value={<span className={debtor.overdueAmount > 0 ? 'text-destructive' : undefined}>{fmtTJS(debtor.overdueAmount)}</span>}
              />
              <InfoItem label={t('profile.overdueCount')} value={debtor.overdueCount} />
              <InfoItem label={t('profile.totalIssued')} value={fmtTJS(debtor.totalIssued)} />
              <InfoItem label={t('profile.totalCollected')} value={fmtTJS(debtor.totalCollected)} />
              <InfoItem label={t('profile.repaymentRate')} value={`${Math.round(debtor.repaymentRate * 100)}%`} />
              <InfoItem
                label={t('profile.maxDaysOverdue')}
                value={debtor.maxDaysOverdue > 0 ? t('profile.daysUnit', { count: debtor.maxDaysOverdue }) : '—'}
              />
              <InfoItem
                label={t('profile.daysSinceLastPayment')}
                value={debtor.daysSinceLastPayment == null ? t('profile.never') : debtor.daysSinceLastPayment}
              />
              <InfoItem
                label={t('profile.lastPaymentAt')}
                value={debtor.lastPaymentAt ? formatDate(debtor.lastPaymentAt, true) : t('profile.never')}
              />
              {debtor.nextDueDate && (
                <InfoItem label={t('profile.nextDueDate')} value={formatDate(debtor.nextDueDate)} />
              )}
            </div>
          </Panel>

          {debtor.factors.length > 0 && (
            <Panel title={t('risk.whyTitle')}>
              <div className="flex flex-wrap items-center gap-2">
                {debtor.factors.map((factor) => (
                  <Badge key={factor} variant="outline" className={DEBTOR_RISK_BADGE[debtor.risk]}>
                    {t(`riskFactors.${factor}`)}
                  </Badge>
                ))}
              </div>
              <p className="text-muted-foreground mt-3 text-xs">
                {t('riskFactors.score', { count: debtor.score })}
              </p>
            </Panel>
          )}

          <Panel title={t('transactionsHistory')}>
            {isTxLoading ? (
              <SkeletonList count={3} />
            ) : transactions.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">{t('noTransactions')}</p>
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
                          <>
                            {' '}
                            · {t('fields.dueDate', { ns: 'transactions' })}: {formatDate(tx.dueDate)}
                          </>
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
            <MarketCard
              market={debtor.market}
              t={t}
              viewState={{ fromPath: location.pathname, fromName: debtor.name }}
            />
          )}

          <QuickActions
            title={t('quickActions')}
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
                label: t('transactionsHistory'),
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
