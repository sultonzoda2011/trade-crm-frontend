import { useQuery } from '@tanstack/react-query';
import { Pencil, ReceiptText, Store } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { sellersApi } from '~/api/sellers';
import { transactionsApi } from '~/api/transactions';
import { Panel } from '~/components/layout/Panel';
import { EditSellerModal } from '~/components/modals/EditSellerModal';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { DetailHeader } from '~/components/shared/DetailHeader';
import { InfoItem } from '~/components/shared/InfoItem';
import { InfoLink } from '~/components/shared/InfoLink';
import { PanelViewAll } from '~/components/shared/PanelViewAll';
import { QuickActions } from '~/components/shared/QuickActions';
import { SkeletonList } from '~/components/shared/SkeletonList';
import { TransactionRow } from '~/components/shared/TransactionRow';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { formatDate } from '~/lib/format';
import { useSellersModals } from '../store';

export default function SellerDetailPage() {
  const { t } = useTranslation(['sellers', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useCan();
  const editModal = useSellersModals((s) => s.edit);

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

  if (isLoading) return <ByIdSkeleton />;

  if (!seller) {
    return (
      <div className="flex h-100 flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">{t('notFound')}</p>
        <Button variant="outline" onClick={() => navigate('/sellers')}>
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
          {
            link: location.state?.fromPath,
            label: location.state?.fromName || t('navigation.sellers', { ns: 'common' }),
          },
          { label: seller.name },
        ]}
      />

      <Panel className="p-6">
        <DetailHeader
          name={seller.name}
          subtitle={seller.email}
          image={seller.image}
          actions={
            can(Action.SELLERS_EDIT) ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => editModal.open(seller)}>
                      <Pencil className="size-3.5" />
                      <span className="hidden sm:inline">{t('actions.edit')}</span>
                    </Button>
                  }
                />
                <TooltipContent side="bottom">{t('actions.edit')}</TooltipContent>
              </Tooltip>
            ) : undefined
          }
        />
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
            title={t('transactionsHistory', { defaultValue: 'Транзакции' })}
            actions={
              transactions.length > 0 ? (
                <PanelViewAll
                  to="/transactions"
                  state={{ fromSellerId: seller.id, fromSellerName: seller.name }}
                  label={t('all', { ns: 'common' })}
                  count={totalTx}
                />
              ) : undefined
            }>
            {isTxLoading ? (
              <SkeletonList count={3} />
            ) : transactions.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                {t('noTransactions', { defaultValue: 'Нет транзакций' })}
              </p>
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
        </div>

        <div className="space-y-6">
          {seller.market && (
            <Panel title={t('fields.market')}>
              <div className="space-y-4">
                <InfoItem
                  label={t('fields.name')}
                  value={
                    <InfoLink
                      to={`/markets/${seller.market.id}`}
                      state={{ fromPath: location.pathname, fromName: seller.name }}>
                      {seller.market.name}
                    </InfoLink>
                  }
                />
                {seller.market.address && <InfoItem label={t('fields.address')} value={seller.market.address} />}
              </div>
            </Panel>
          )}

          <QuickActions
            title={t('quickActions', { defaultValue: 'Быстрые действия' })}
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
              {
                icon: ReceiptText,
                label: t('transactionsHistory', { defaultValue: 'Транзакции' }),
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
    </div>
  );
}
