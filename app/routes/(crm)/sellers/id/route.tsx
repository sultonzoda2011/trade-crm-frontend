import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Pencil, ReceiptText, Store } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { sellersApi } from '~/api/sellers';
import { transactionsApi } from '~/api/transactions';
import { Panel } from '~/components/layout/Panel';
import { EditSellerModal } from '~/components/modals/EditSellerModal';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { InfoItem } from '~/components/shared/InfoItem';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { fmtTJS, formatDate } from '~/lib/format';
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
        <div className="flex items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <Avatar className="size-16 rounded-xl">
              {seller.image && <AvatarImage src={seller.image} alt={seller.name} className="object-cover" />}
              <AvatarFallback className="bg-muted rounded-xl text-2xl font-semibold">
                {seller.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-bold tracking-tight">{seller.name}</h1>
              <p className="text-muted-foreground text-sm">{seller.email}</p>
            </div>
          </div>
          {can(Action.SELLERS_EDIT) && (
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
          )}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InfoItem label={t('fields.name')} value={seller.name} />
              <InfoItem label={t('fields.email')} value={seller.email} />
              <InfoItem label={t('fields.createdAt')} value={formatDate(seller.createdAt, true)} />
            </div>
          </Panel>

          <Panel
            title={t('transactionsHistory', { defaultValue: 'Транзакции' })}
            actions={
              transactions.length > 0 ? (
                <Link
                  to="/transactions"
                  state={{ fromSellerId: seller.id, fromSellerName: seller.name }}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium transition-colors">
                  {t('all', { ns: 'common' })} ({totalTx})
                  <ArrowUpRight className="size-3" />
                </Link>
              ) : undefined
            }>
            {isTxLoading ? (
              <div className="space-y-2 py-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-muted/50 h-14 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                {t('noTransactions', { defaultValue: 'Нет транзакций' })}
              </p>
            ) : (
              <div className="divide-border divide-y">
                {transactions.map((tx) => (
                  <Link
                    key={tx.id}
                    to={`/transactions/${tx.id}`}
                    state={{ fromPath: location.pathname, fromName: seller.name }}
                    className="hover:bg-muted/40 -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-3 transition-colors">
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
                        {tx.debtor && <> · {tx.debtor.name}</>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-semibold">{fmtTJS(tx.totalAmount)}</p>
                      {tx.remainingAmount > 0 && (
                        <p className="text-warning font-mono text-xs">
                          {t('remaining', { ns: 'transactions', defaultValue: 'Остаток' })}:{' '}
                          {fmtTJS(tx.remainingAmount)}
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
          {seller.market && (
            <Panel title={t('fields.market')}>
              <div className="space-y-4">
                <InfoItem
                  label={t('fields.name')}
                  value={
                    <Link
                      to={`/markets/${seller.market.id}`}
                      className="group text-primary inline-flex items-center gap-1 text-sm font-semibold hover:underline">
                      {seller.market.name}
                      <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  }
                />
                {seller.market.address && <InfoItem label={t('fields.address')} value={seller.market.address} />}
              </div>
            </Panel>
          )}

          <Panel title={t('quickActions', { defaultValue: 'Быстрые действия' })}>
            <div className="space-y-2">
              {can(Action.SELLERS_EDIT) && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  size="sm"
                  onClick={() => editModal.open(seller)}>
                  <Pencil className="size-3.5" />
                  {t('actions.edit')}
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                size="sm"
                render={<Link to="/transactions" state={{ fromSellerId: seller.id, fromSellerName: seller.name }} />}>
                <ReceiptText className="size-3.5" />
                {t('transactionsHistory', { defaultValue: 'Транзакции' })}
              </Button>
              {seller.market && (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  size="sm"
                  render={<Link to={`/markets/${seller.market.id}`} />}>
                  <Store className="size-3.5" />
                  {t('fields.market')}
                </Button>
              )}
            </div>
          </Panel>
        </div>
      </div>

      <EditSellerModal />
    </div>
  );
}
