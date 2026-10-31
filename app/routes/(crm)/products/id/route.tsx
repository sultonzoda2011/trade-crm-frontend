import { useQuery } from '@tanstack/react-query';
import { Archive, ArchiveRestore, ClipboardCheck, Package, PackageMinus, PackagePlus, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router';
import { productsApi } from '~/api/products';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { AdjustStockModal } from '~/components/modals/AdjustStockModal';
import { ArchiveProductDialog } from '~/components/modals/ArchiveProductDialog';
import { RestockProductModal } from '~/components/modals/RestockProductModal';
import { WriteOffProductModal } from '~/components/modals/WriteOffProductModal';
import { StockHistory } from '~/components/products/StockHistory';
import { ConfirmDialog } from '~/components/shared/ConfirmDialog';
import { DetailFacts } from '~/components/shared/DetailFacts';
import { DetailHero } from '~/components/shared/DetailHero';
import { DetailPage } from '~/components/shared/DetailPage';
import { EntityAvatar } from '~/components/shared/EntityAvatar';
import { EntityRow } from '~/components/shared/EntityRow';
import { ListGroup, ListRow } from '~/components/shared/ListGroup';
import { MetricGrid } from '~/components/shared/MetricGrid';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import { OfflineBlock } from '~/components/shared/OfflineBlock';
import { TrendBadge } from '~/components/shared/TrendBadge';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { PRODUCT_HEALTH_BADGE, REORDER_PRIORITY_BADGE } from '~/config/analyticsBadges';
import { useCan } from '~/hooks/useCan';
import { useArchiveProduct } from '~/hooks/useArchiveProduct';
import { useDeleteEntity } from '~/hooks/useDeleteEntity';
import { fmtTJS, formatDate } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';
import { useProductsModals } from '~/routes/(crm)/products/store';

export default function ProductDetailPage() {
  const { t } = useTranslation(['products', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useCan();

  const {
    data: response,
    isLoading,
    fetchStatus,
  } = useQuery({
    queryKey: queryKeys.detail('products', id),
    queryFn: () => productsApi.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const restockModal = useProductsModals((s) => s.restock);
  const writeOffModal = useProductsModals((s) => s.writeOff);
  const adjustModal = useProductsModals((s) => s.adjust);
  const archiveModal = useProductsModals((s) => s.archive);
  const { restore } = useArchiveProduct();
  const { requestDelete, deleteDialog } = useDeleteEntity({
    entity: 'products',
    api: productsApi,
    id,
    t,
    redirectTo: '/products',
  });

  const product = response?.data;
  // Карточка ни разу не грузилась и сейчас на паузе из-за офлайна — отличаем
  // от "не найдено" (см. app/lib/network-status.ts).
  const isOfflineEmpty = fetchStatus === 'paused' && !product;

  if (isLoading) return <ByIdSkeleton />;

  if (isOfflineEmpty) {
    return (
      <OfflineBlock
        label={t('offline.noCachedData', { ns: 'common' })}
        onBack={() => navigate('/products')}
        backLabel={t('actions.back', { ns: 'common' })}
      />
    );
  }

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
  // Нет поля (старый ответ/кэш) = активный.
  const isArchived = product.isActive === false;
  // Проданный товар удалить нельзя (в чеках остаётся его строка) — только в архив; бэкенд ответил бы 409.
  const hasHistory = product._count.transactionItems > 0;
  const canManageStock = can(Action.PRODUCTS_STOCK);
  const stockTarget = { id: product.id, name: product.name, quantity: product.quantity, unit: product.unit };
  const marketState = { fromPath: location.pathname, fromName: t('title') };
  const unit = t(`unit.${product.unit}`);

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
  const { metrics, comparison, sales } = product;

  return (
    <>
      <DetailPage
        crumbs={[
          { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
          { link: location.state?.fromPath, label: location.state?.fromName || t('title') },
          { label: product.name },
        ]}
        hero={
          <DetailHero
            avatar={<EntityAvatar name={product.name} image={product.image} icon={Package} shape="square" size="lg" />}
            title={product.name}
            subtitle={product.market?.name}
            badges={
              <>
                {product.category && (
                  <Badge variant="secondary" className="font-normal">
                    {product.category.name}
                  </Badge>
                )}
                {isArchived && (
                  <Badge variant="secondary" className="font-normal">
                    {t('archive.badge')}
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
            stats={[
              { label: t('fields.price'), value: fmtTJS(product.price) },
              {
                label: t('fields.quantity'),
                value: `${product.quantity} ${unit}`,
                tone: isLowStock ? 'danger' : 'default',
              },
              { label: t('metrics.netUnitsSold'), value: sales.unitsSold },
            ]}
            actions={
              can(Action.PRODUCTS_EDIT) && !isArchived ? (
                <Button size="lg" onClick={() => restockModal.open(stockTarget)}>
                  <PackagePlus data-icon="inline-start" />
                  {t('restock.button')}
                </Button>
              ) : undefined
            }
            manage={{
              editTo: can(Action.PRODUCTS_EDIT) ? `/products/${product.id}/edit` : undefined,
              onDelete: can(Action.PRODUCTS_DELETE) && !hasHistory ? requestDelete : undefined,
            }}
          />
        }
        aside={
          product.market ? (
            <ListGroup title={t('fields.market')}>
              <EntityRow
                name={product.market.name}
                subtitle={product.market.address ?? undefined}
                image={product.market.image}
                shape="square"
                icon={Store}
                to={`/markets/${product.marketId}`}
                state={marketState}
              />
            </ListGroup>
          ) : undefined
        }>
        {isArchived && (
          <p className="bg-warning/12 text-warning rounded-2xl px-4 py-3 text-sm font-medium">{t('archive.banner')}</p>
        )}

        {(canManageStock || can(Action.PRODUCTS_EDIT)) && (
          <ListGroup
            title={t('stockActions.title')}
            footer={hasHistory && can(Action.PRODUCTS_DELETE) ? t('archive.deleteBlocked') : undefined}>
            {canManageStock && !isArchived && (
              <ListRow
                leading={<PackageMinus className="text-muted-foreground size-5" />}
                title={t('writeOff.button')}
                onClick={() => writeOffModal.open(stockTarget)}
              />
            )}
            {canManageStock && !isArchived && (
              <ListRow
                leading={<ClipboardCheck className="text-muted-foreground size-5" />}
                title={t('adjust.button')}
                onClick={() => adjustModal.open(stockTarget)}
              />
            )}
            {can(Action.PRODUCTS_EDIT) &&
              (isArchived ? (
                <ListRow
                  leading={<ArchiveRestore className="text-muted-foreground size-5" />}
                  title={t('archive.restore')}
                  onClick={() => restore.mutate(product.id)}
                />
              ) : (
                <ListRow
                  leading={<Archive className="text-muted-foreground size-5" />}
                  title={t('archive.button')}
                  onClick={() => archiveModal.open(product.id)}
                />
              ))}
          </ListGroup>
        )}

        <DetailFacts
          facts={[
            { label: t('fields.description'), value: product.description, long: true, show: !!product.description },
            { label: t('fields.category'), value: product.category?.name ?? '—' },
            { label: t('fields.costPrice'), value: fmtTJS(product.costPrice ?? 0), show: product.costPrice != null },
            { label: t('fields.lowStockThreshold'), value: `${product.lowStockThreshold} ${unit}` },
            { label: t('fields.createdAt'), value: formatDate(product.createdAt, true) },
            { label: t('fields.updatedAt'), value: formatDate(product.updatedAt, true) },
          ]}
        />

        <MetricGrid
          title={t('metrics.title')}
          metrics={[
            {
              label: t('metrics.revenue'),
              value: fmtTJS(metrics.revenue),
              trend: <TrendBadge comparison={comparison.revenue} />,
            },
            {
              label: t('metrics.netUnitsSold'),
              value: metrics.netUnitsSold,
              trend: <TrendBadge comparison={comparison.netUnitsSold} />,
            },
            {
              label: t('metrics.transactionCount'),
              value: metrics.transactionCount,
              trend: <TrendBadge comparison={comparison.transactionCount} />,
            },
            { label: t('metrics.refundedUnits'), value: metrics.refundedUnits },
            { label: t('metrics.returnRate'), value: `${Math.round(metrics.returnRate * 100)}%` },
            { label: t('metrics.avgDailySales'), value: metrics.avgDailySales.toFixed(1) },
            {
              label: t('metrics.daysOfStock'),
              value:
                metrics.daysOfStockRemaining == null
                  ? t('metrics.noVelocity')
                  : t('metrics.daysUnit', { count: metrics.daysOfStockRemaining }),
            },
            ...(metrics.recommendedQuantity > 0
              ? [{ label: t('metrics.recommendedQuantity'), value: `${metrics.recommendedQuantity} ${unit}` }]
              : []),
          ]}
        />

        <MetricGrid
          title={t('metrics.allTime')}
          metrics={[
            { label: t('metrics.transactionCount'), value: sales.count },
            { label: t('metrics.netUnitsSold'), value: sales.unitsSold },
            { label: t('metrics.refundedUnits'), value: sales.refundedUnits },
            { label: t('metrics.revenue'), value: fmtTJS(sales.revenue) },
          ]}
        />

        {canManageStock && <StockHistory productId={product.id} unit={product.unit} />}
      </DetailPage>
      <ConfirmDialog {...deleteDialog} />
      <ArchiveProductDialog />
      <RestockProductModal />
      <WriteOffProductModal />
      <AdjustStockModal />
    </>
  );
}
