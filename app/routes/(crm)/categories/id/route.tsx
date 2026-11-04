import { useQuery } from '@tanstack/react-query';
import { Package, Store } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router';
import { categoriesApi } from '~/api/categories';
import { CategoryTile } from '~/components/categories/CategoryTile';
import { DeleteCategoryDialog } from '~/components/categories/DeleteCategoryDialog';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { DetailFacts } from '~/components/shared/DetailFacts';
import { DetailHero } from '~/components/shared/DetailHero';
import { DetailPage } from '~/components/shared/DetailPage';
import { EntityRow } from '~/components/shared/EntityRow';
import { ListGroup } from '~/components/shared/ListGroup';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import { OfflineBlock } from '~/components/shared/OfflineBlock';
import { PanelViewAll } from '~/components/shared/PanelViewAll';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { fmtNum, fmtTJS, formatDate } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';
import { useCategoriesModals } from '~/routes/(crm)/categories/store';

const PREVIEW_LIMIT = 5;

export default function CategoryDetailPage() {
  const { t } = useTranslation(['categories', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useCan();
  const removeModal = useCategoriesModals((s) => s.remove);

  const {
    data: response,
    isLoading,
    fetchStatus,
  } = useQuery({
    queryKey: queryKeys.full('categories', id),
    queryFn: () => categoriesApi.getFull(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const category = response?.data?.category;
  const market = response?.data?.market ?? undefined;
  const categoryProducts = useMemo(() => response?.data?.products?.data ?? [], [response]);
  // Карточка ни разу не грузилась и сейчас на паузе из-за офлайна — отличаем
  // от "не найдено" (см. app/lib/network-status.ts).
  const isOfflineEmpty = fetchStatus === 'paused' && !category;

  if (isLoading) return <ByIdSkeleton />;

  if (isOfflineEmpty) {
    return (
      <OfflineBlock
        label={t('offline.noCachedData', { ns: 'common' })}
        onBack={() => navigate('/categories')}
        backLabel={t('actions.back', { ns: 'common' })}
      />
    );
  }

  if (!category) {
    return (
      <NotFoundBlock
        label={t('notFound')}
        onBack={() => navigate('/categories')}
        backLabel={t('actions.back', { ns: 'common' })}
      />
    );
  }

  const listState = { fromPath: location.pathname + location.search };
  const filterState = { fromCategoryId: category.id, fromCategoryName: category.name };
  const productsCount = category._count.products;
  const archivedCount = category.archivedCount ?? 0;
  const stockValue = category.stockValue;
  const outCount = category.outOfStockCount ?? 0;
  const lowCount = category.lowStockCount ?? 0;

  return (
    <>
      <DetailPage
        trail={{ kind: 'view', section: 'categories', name: category.name }}
        hero={
          <DetailHero
            avatar={<CategoryTile image={category.image} color={category.color} className="size-14 rounded-2xl" />}
            title={category.name}
            manage={{
              editTo: can(Action.CATEGORIES_MANAGE) ? `/categories/${category.id}/edit` : undefined,
              onDelete: can(Action.CATEGORIES_MANAGE)
                ? () =>
                    removeModal.open({
                      id: category.id,
                      name: category.name,
                      productsCount: productsCount + archivedCount,
                      redirectTo: '/categories',
                    })
                : undefined,
            }}
            stats={[
              { label: t('fields.productsCount'), value: productsCount, to: '/products', state: filterState },
              ...(stockValue !== undefined ? [{ label: t('fields.stockValue'), value: fmtNum(stockValue) }] : []),
              ...(outCount > 0 ? [{ label: t('detail.outOfStock'), value: outCount, tone: 'danger' as const }] : []),
              ...(lowCount > 0 ? [{ label: t('detail.lowStock'), value: lowCount, tone: 'warning' as const }] : []),
            ]}
          />
        }
        aside={
          <ListGroup title={t('fields.market')}>
            <EntityRow
              name={market?.name ?? category.marketId}
              subtitle={market?.address ?? undefined}
              image={market?.image}
              shape="square"
              icon={Store}
              to={`/markets/${category.marketId}`}
              state={listState}
            />
          </ListGroup>
        }>
        <DetailFacts
          facts={[
            { label: t('fields.description'), value: category.description, long: true, show: !!category.description },
            {
              label: t('detail.archived'),
              value: archivedCount,
              show: archivedCount > 0,
            },
            { label: t('fields.createdAt'), value: formatDate(category.createdAt, true) },
            { label: t('fields.updatedAt'), value: formatDate(category.updatedAt, true) },
          ]}
        />

        {categoryProducts.length > 0 && (
          <ListGroup
            title={t('fields.productsCount')}
            action={
              productsCount > PREVIEW_LIMIT ? (
                <PanelViewAll to="/products" state={filterState} label={t('viewAll')} count={productsCount} />
              ) : undefined
            }>
            {categoryProducts.map((product) => (
              <EntityRow
                key={product.id}
                name={product.name}
                subtitle={`${product.quantity} ${t('unit.' + product.unit, { ns: 'products' })}`}
                image={product.image}
                shape="square"
                icon={Package}
                to={`/products/${product.id}`}
                state={listState}
                value={<span className="text-foreground font-mono text-sm font-semibold">{fmtTJS(product.price)}</span>}
              />
            ))}
          </ListGroup>
        )}
      </DetailPage>
      <DeleteCategoryDialog />
    </>
  );
}
