import { useQuery } from '@tanstack/react-query';
import { Package, Pencil, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { productsApi } from '~/api/products';
import { Panel } from '~/components/layout/Panel';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { DetailHeader } from '~/components/shared/DetailHeader';
import { InfoItem } from '~/components/shared/InfoItem';
import { InfoLink } from '~/components/shared/InfoLink';
import { MarketCard } from '~/components/shared/MarketCard';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import { QuickActions } from '~/components/shared/QuickActions';
import { StatCard } from '~/components/shared/StatCard';
import { TrendBadge } from '~/components/shared/TrendBadge';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Action } from '~/config/actions';
import { PRODUCT_HEALTH_BADGE, REORDER_PRIORITY_BADGE } from '~/config/analyticsBadges';
import { useCan } from '~/hooks/useCan';
import { fmtTJS, formatDate } from '~/lib/format';

export default function ProductDetailPage() {
  const { t } = useTranslation(['products', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useCan();

  const { data: response, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const product = response?.data;

  if (isLoading) return <ByIdSkeleton />;

  if (!product) {
    return (
      <NotFoundBlock
        label={t('notFound')}
        onBack={() => navigate('/products')}
        backLabel={t('actions.back', { ns: 'common' })}
      />
    );
  }

  const isLowStock = product.quantity <= product.lowStockThreshold;
  const marketState = { fromPath: location.pathname, fromName: t('title') };

  // health (7 состояний) — основной сигнал состояния товара, он уже покрывает
  // OUT_OF_STOCK / CRITICAL / LOW_STOCK, поэтому ручной бейдж lowStock его дублирует.
  // reorderPriority — действие по закупке; пока запас на исходе он повторяет health
  // (OUT_OF_STOCK/CRITICAL/LOW_STOCK ⇢ OUT_OF_STOCK/CRITICAL/WARNING). Показываем его
  // только когда health описывает НЕ складскую проблему (напр. много возвратов), а
  // заказывать всё равно пора — иначе это третий бейдж с тем же смыслом.
  const health = product.metrics?.health;
  const reorderPriority = product.metrics?.reorderPriority;
  const healthCoversStock = health === 'OUT_OF_STOCK' || health === 'CRITICAL' || health === 'LOW_STOCK';
  const reorderIsActionable =
    reorderPriority === 'OUT_OF_STOCK' || reorderPriority === 'CRITICAL' || reorderPriority === 'WARNING';
  const showReorderBadge = reorderIsActionable && !healthCoversStock;

  return (
    <div className="flex flex-1 flex-col space-y-4 pb-6">
      <BreadCrumbs
        items={[
          { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
          { link: location.state?.fromPath, label: location.state?.fromName || t('title') },
          { label: product.name },
        ]}
      />

      <Panel bodyClassName="p-4">
        <DetailHeader
          name={product.name}
          subtitle={product.market?.name}
          image={product.image}
          badges={
            <>
              {product.category && (
                <Badge variant="secondary" className="font-normal">
                  {product.category.name}
                </Badge>
              )}
              {health ? (
                <Badge variant="outline" className={PRODUCT_HEALTH_BADGE[health]}>
                  {t(`health.${health}`)}
                </Badge>
              ) : (
                isLowStock && (
                  <Badge variant="destructive" className="font-normal">
                    {t('lowStock')}
                  </Badge>
                )
              )}
              {showReorderBadge && reorderPriority && (
                <Badge variant="outline" className={REORDER_PRIORITY_BADGE[reorderPriority]}>
                  {t(`reorderPriority.${reorderPriority}`)}
                </Badge>
              )}
            </>
          }
        />
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel>
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
              <InfoItem
                label={t('fields.name')}
                value={
                  <span className="flex items-center gap-2">
                    <Avatar size="sm" className="shrink-0">
                      {product.image ? <AvatarImage src={product.image} alt={product.name} /> : null}
                      <AvatarFallback>{product.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{product.name}</span>
                  </span>
                }
              />
              <InfoItem label={t('fields.description')} value={product.description} />
              <InfoItem label={t('fields.price')} value={fmtTJS(product.price)} />
              <InfoItem
                label={t('fields.quantity')}
                value={
                  <span className="flex items-center gap-2">
                    <span className={isLowStock ? 'text-destructive font-semibold' : undefined}>
                      {product.quantity} {t(`unit.${product.unit}`)}
                    </span>
                    {isLowStock && (
                      <Badge variant="destructive" className="text-xs font-normal">
                        {t('lowStock')}
                      </Badge>
                    )}
                  </span>
                }
              />

              <InfoItem
                label={t('fields.lowStockThreshold')}
                value={`${product.lowStockThreshold} ${t(`unit.${product.unit}`)}`}
              />
              <InfoItem label={t('fields.category')} value={product.category?.name ?? '—'} />
              <InfoItem
                label={t('fields.market')}
                value={
                  <span className="flex items-center gap-2">
                    <Avatar size="sm" className="shrink-0">
                      {product.market?.image ? (
                        <AvatarImage src={product.market.image} alt={product.market.name} />
                      ) : null}
                      <AvatarFallback>{(product.market?.name ?? '?').charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <InfoLink to={`/markets/${product.marketId}`} state={marketState}>
                      {product.market?.name}
                    </InfoLink>
                  </span>
                }
              />
              <InfoItem label={t('fields.createdAt')} value={formatDate(product.createdAt, true)} />
              <InfoItem label={t('fields.updatedAt')} value={formatDate(product.updatedAt, true)} />
            </div>
          </Panel>

          <Panel title={t('metrics.title')}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <InfoItem
                label={t('metrics.revenue')}
                value={
                  <span className="flex items-center gap-2">
                    {fmtTJS(product.metrics.revenue)}
                    <TrendBadge comparison={product.comparison.revenue} />
                  </span>
                }
              />
              <InfoItem
                label={t('metrics.netUnitsSold')}
                value={
                  <span className="flex items-center gap-2">
                    {product.metrics.netUnitsSold}
                    <TrendBadge comparison={product.comparison.netUnitsSold} />
                  </span>
                }
              />
              <InfoItem
                label={t('metrics.transactionCount')}
                value={
                  <span className="flex items-center gap-2">
                    {product.metrics.transactionCount}
                    <TrendBadge comparison={product.comparison.transactionCount} />
                  </span>
                }
              />
              <InfoItem label={t('metrics.refundedUnits')} value={product.metrics.refundedUnits} />
              <InfoItem label={t('metrics.returnRate')} value={`${Math.round(product.metrics.returnRate * 100)}%`} />
              <InfoItem label={t('metrics.avgDailySales')} value={product.metrics.avgDailySales.toFixed(1)} />
              <InfoItem
                label={t('metrics.daysOfStock')}
                value={
                  product.metrics.daysOfStockRemaining == null
                    ? t('metrics.noVelocity')
                    : t('metrics.daysUnit', { count: product.metrics.daysOfStockRemaining })
                }
              />
              {product.metrics.recommendedQuantity > 0 && (
                <InfoItem
                  label={t('metrics.recommendedQuantity')}
                  value={`${product.metrics.recommendedQuantity} ${t(`unit.${product.unit}`)}`}
                />
              )}
            </div>
          </Panel>

          <Panel title={t('metrics.allTime')}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StatCard icon={Package} label={t('metrics.transactionCount')} value={product.sales.count} />
              <StatCard icon={Package} label={t('metrics.netUnitsSold')} value={product.sales.unitsSold} />
              <StatCard icon={Package} label={t('metrics.refundedUnits')} value={product.sales.refundedUnits} />
              <StatCard
                icon={Package}
                label={t('metrics.revenue')}
                value={fmtTJS(product.sales.revenue)}
                to={`/transactions?productId=${product.id}`}
              />
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <MarketCard market={product.market!} t={t} viewState={marketState} />

          <QuickActions
            title={t('quickActions')}
            actions={[
              ...(can(Action.PRODUCTS_EDIT)
                ? [
                    {
                      icon: Pencil,
                      label: t('actions.edit'),
                      variant: 'outline' as const,
                      render: <Link to={`/products/${product.id}/edit`} />,
                    },
                  ]
                : []),
              ...(product.market
                ? [
                    {
                      icon: Store,
                      label: t('fields.market'),
                      render: <Link to={`/markets/${product.marketId}`} />,
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </div>
    </div>
  );
}
