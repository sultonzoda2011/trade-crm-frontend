import { useQuery } from '@tanstack/react-query';
import { Coins, Pencil, ReceiptText, Store, Wallet } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { sellersApi } from '~/api/sellers';
import { transactionsApi } from '~/api/transactions';
import { Panel } from '~/components/layout/Panel';
import { EditSellerModal } from '~/components/modals/EditSellerModal';
import { PayoutSellerModal } from '~/components/modals/PayoutSellerModal';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { DetailHeader } from '~/components/shared/DetailHeader';
import { InfoItem } from '~/components/shared/InfoItem';
import { MarketCard } from '~/components/shared/MarketCard';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import { PanelViewAll } from '~/components/shared/PanelViewAll';
import { QuickActions } from '~/components/shared/QuickActions';
import { SkeletonList } from '~/components/shared/SkeletonList';
import { TransactionRow } from '~/components/shared/TransactionRow';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { fmtTJS, formatDate } from '~/lib/format';
import { useSellersModals } from '~/routes/(crm)/sellers/store';

export default function SellerDetailPage() {
  const { t } = useTranslation(['sellers', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useCan();
  const editModal = useSellersModals((s) => s.edit);
  const payoutModal = useSellersModals((s) => s.payout);

  const { data: response, isLoading } = useQuery({
    queryKey: ['seller', id],
    queryFn: () => sellersApi.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const seller = response?.data;

  const { data: txResponse, isLoading: isTxLoading } = useQuery({
    queryKey: ['seller-transactions', id],
    queryFn: () => transactionsApi.getAll(1, 5, {}, [{ key: 'createdById', value: id! }]),
    enabled: !!id,
    staleTime: 30_000,
  });

  const transactions = useMemo(() => txResponse?.data?.data ?? [], [txResponse]);
  const totalTx = txResponse?.data?.meta?.total ?? 0;

  const { data: balanceResponse, isLoading: isBalanceLoading } = useQuery({
    queryKey: ['seller-balance', id],
    queryFn: () => sellersApi.getBalance(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const balance = balanceResponse?.data;

  const { data: creditsResponse, isLoading: isCreditsLoading } = useQuery({
    queryKey: ['seller-credits', id],
    queryFn: () => sellersApi.getCredits(id!, 1, 5),
    enabled: !!id,
    staleTime: 30_000,
  });

  const credits = useMemo(() => creditsResponse?.data?.data ?? [], [creditsResponse]);

  if (isLoading) return <ByIdSkeleton />;

  if (!seller) {
    return (
      <NotFoundBlock
        label={t('notFound')}
        onBack={() => navigate('/sellers')}
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
            label: location.state?.fromName || t('navigation.sellers', { ns: 'common' }),
          },
          { label: seller.name },
        ]}
      />

      <Panel className="p-6">
        <DetailHeader name={seller.name} subtitle={seller.email} image={seller.image} />
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InfoItem
                label={t('fields.name')}
                value={
                  <span className="flex items-center gap-2">
                    <Avatar size="sm" className="shrink-0">
                      {seller.image ? <AvatarImage src={seller.image} alt={seller.name} /> : null}
                      <AvatarFallback>{seller.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{seller.name}</span>
                  </span>
                }
              />
              <InfoItem label={t('fields.email')} value={seller.email} />
              <InfoItem label={t('fields.createdAt')} value={formatDate(seller.createdAt, true)} />
            </div>
          </Panel>

          <Panel
            title={t('transactionsHistory')}
            actions={
              transactions.length > 0 ? (
                <PanelViewAll
                  to="/transactions"
                  state={{ fromSellerId: seller.id, fromSellerName: seller.name }}
                  label={t('filters.all', { ns: 'common' })}
                  count={totalTx}
                />
              ) : undefined
            }>
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
                    state={{ fromPath: location.pathname, fromName: seller.name }}
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel
            title={t('markupBalance')}
            actions={
              can(Action.SELLERS_EDIT) && balance && balance.balance > 0 ? (
                <Button size="sm" className="gap-1.5 text-xs" onClick={() => payoutModal.open(seller)}>
                  <Wallet className="h-3.5 w-3.5" />
                  {t('payout')}
                </Button>
              ) : undefined
            }>
            {isBalanceLoading ? (
              <SkeletonList count={1} />
            ) : !balance || balance.earned === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">{t('noBalance')}</p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <InfoItem label={t('earned')} value={<span className="font-mono">{fmtTJS(balance.earned)}</span>} />
                  {balance.refunded > 0 && (
                    <InfoItem
                      label={t('refunded')}
                      value={<span className="text-destructive font-mono">− {fmtTJS(balance.refunded)}</span>}
                    />
                  )}
                  <InfoItem label={t('paidOut')} value={<span className="font-mono">{fmtTJS(balance.paidOut)}</span>} />
                  <InfoItem
                    label={t('balance')}
                    value={<span className="text-success font-mono font-semibold">{fmtTJS(balance.balance)}</span>}
                  />
                </div>

                {credits.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-medium">
                      <Coins className="h-3.5 w-3.5" />
                      {t('creditsHistory')}
                    </p>
                    {isCreditsLoading ? (
                      <SkeletonList count={2} />
                    ) : (
                      <div className="divide-border divide-y">
                        {credits.map((credit) => (
                          <div key={credit.id} className="flex items-center justify-between py-2 text-sm">
                            <div className="flex flex-col">
                              <span className="font-mono font-medium">{fmtTJS(credit.amount)}</span>
                              {credit.note && <span className="text-muted-foreground text-xs">{credit.note}</span>}
                            </div>
                            <span className="text-muted-foreground text-xs">{formatDate(credit.createdAt, true)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          {seller.market && (
            <MarketCard
              market={seller.market}
              t={t}
              viewState={{ fromPath: location.pathname, fromName: seller.name }}
            />
          )}

          <QuickActions
            title={t('quickActions')}
            actions={[
              ...(can(Action.SELLERS_EDIT)
                ? [
                    {
                      icon: Pencil,
                      label: t('actions.edit'),
                      variant: 'outline' as const,
                      onClick: () => editModal.open(seller),
                    },
                  ]
                : []),
              ...(can(Action.SELLERS_EDIT) && balance && balance.balance > 0
                ? [
                    {
                      icon: Wallet,
                      label: t('payout'),
                      variant: 'outline' as const,
                      onClick: () => payoutModal.open(seller),
                    },
                  ]
                : []),
              {
                icon: ReceiptText,
                label: t('transactionsHistory'),
                render: <Link to="/transactions" state={{ fromSellerId: seller.id, fromSellerName: seller.name }} />,
              },
              ...(seller.market
                ? [
                    {
                      icon: Store,
                      label: t('fields.market'),
                      render: <Link to={`/markets/${seller.market.id}`} />,
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </div>

      <EditSellerModal />
      <PayoutSellerModal />
    </div>
  );
}
