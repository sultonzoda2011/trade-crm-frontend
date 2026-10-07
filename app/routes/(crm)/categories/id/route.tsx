import { useQuery } from '@tanstack/react-query';
import { Package, Store, Tag } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router';
import { categoriesApi } from '~/api/categories';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { DetailFacts } from '~/components/shared/DetailFacts';
import { DetailHero } from '~/components/shared/DetailHero';
import { DetailPage } from '~/components/shared/DetailPage';
import { EntityAvatar } from '~/components/shared/EntityAvatar';
import { EntityRow } from '~/components/shared/EntityRow';
import { ListGroup } from '~/components/shared/ListGroup';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import { PanelViewAll } from '~/components/shared/PanelViewAll';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { fmtTJS, formatDate } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';

const PREVIEW_LIMIT = 5;

export default function CategoryDetailPage() {
  const { t } = useTranslation(['categories', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useCan();

  const { data: response, isLoading } = useQuery({
    queryKey: queryKeys.full('categories', id),
    queryFn: () => categoriesApi.getFull(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const category = response?.data?.category;
  const market = response?.data?.market ?? undefined;
  const categoryProducts = useMemo(() => response?.data?.products?.data ?? [], [response]);

  if (isLoading) return <ByIdSkeleton />;

  if (!category) {
    return (
      <NotFoundBlock
        label={t('notFound')}
        onBack={() => navigate('/categories')}
        backLabel={t('actions.back', { ns: 'common' })}
      />
    );
  }

  const listState = { fromPath: location.pathname, fromName: category.name };
  const filterState = { fromCategoryId: category.id, fromCategoryName: category.name };
  const productsCount = category._count.products;

  return (
    <DetailPage
      crumbs={[
        { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
        { link: location.state?.fromPath, label: location.state?.fromName || t('title') },
        { label: category.name },
      ]}
      hero={
        <DetailHero
          avatar={<EntityAvatar name={category.name} image={category.image} icon={Tag} shape="square" size="lg" />}
          title={category.name}
          editTo={can(Action.CATEGORIES_MANAGE) ? `/categories/${category.id}/edit` : undefined}
          editLabel={t('actions.edit')}
          stats={[{ label: t('fields.productsCount'), value: productsCount }]}
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
  );
}
