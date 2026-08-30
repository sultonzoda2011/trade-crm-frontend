import { useQuery } from '@tanstack/react-query';
import { Package, Pencil, Store } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { categoriesApi } from '~/api/categories';
import { marketsApi } from '~/api/markets';
import { productsApi } from '~/api/products';
import { Panel } from '~/components/layout/Panel';
import { EditCategoryModal } from '~/components/modals/EditCategoryModal';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { DetailHeader } from '~/components/shared/DetailHeader';
import { InfoItem } from '~/components/shared/InfoItem';
import { InfoLink } from '~/components/shared/InfoLink';
import { ListLink } from '~/components/shared/ListLink';
import { MarketCard } from '~/components/shared/MarketCard';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import { PanelViewAll } from '~/components/shared/PanelViewAll';
import { QuickActions } from '~/components/shared/QuickActions';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { fmtTJS, formatDate } from '~/lib/format';
import { useCategoriesModals } from '~/routes/(crm)/categories/store';

export default function CategoryDetailPage() {
  const { t } = useTranslation(['categories', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useCan();
  const editModal = useCategoriesModals((s) => s.edit);

  const { data: response, isLoading } = useQuery({
    queryKey: ['category', id],
    queryFn: () => categoriesApi.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const category = response?.data;

  const { data: marketResponse } = useQuery({
    queryKey: ['market-by-category', category?.marketId],
    queryFn: () => marketsApi.getById(category!.marketId),
    enabled: !!category?.marketId,
    staleTime: 60_000,
  });

  const market = marketResponse?.data;

  const PREVIEW_LIMIT = 5;

  const { data: productsResponse } = useQuery({
    queryKey: ['category-products', id],
    queryFn: () => productsApi.getAll(1, PREVIEW_LIMIT, {}, [{ key: 'categoryId', value: id! }]),
    enabled: !!id,
    staleTime: 30_000,
  });

  const categoryProducts = useMemo(() => productsResponse?.data?.data ?? [], [productsResponse]);

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

  return (
    <div className="flex flex-1 flex-col space-y-4 pb-6">
      <BreadCrumbs
        items={[
          { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
          { link: location.state?.fromPath, label: location.state?.fromName || t('title') },
          { label: category.name },
        ]}
      />

      <Panel bodyClassName="p-4">
        <DetailHeader name={category.name} subtitle={category.description ?? undefined} image={category.image} />
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
                      {category.image ? <AvatarImage src={category.image} alt={category.name} /> : null}
                      <AvatarFallback>{category.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{category.name}</span>
                  </span>
                }
              />
              {category.description && <InfoItem label={t('fields.description')} value={category.description} />}
              <InfoItem
                label={t('fields.market')}
                value={
                  <span className="flex items-center gap-2">
                    <Avatar size="sm" className="shrink-0">
                      {market?.image ? <AvatarImage src={market.image} alt={market.name} /> : null}
                      <AvatarFallback>{(market?.name ?? '?').charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <InfoLink to={`/markets/${category.marketId}`} state={listState}>
                      {market?.name ?? category.marketId}
                    </InfoLink>
                  </span>
                }
              />
              <InfoItem label={t('fields.createdAt')} value={formatDate(category.createdAt, true)} />
              <InfoItem label={t('fields.updatedAt')} value={formatDate(category.updatedAt, true)} />
            </div>
          </Panel>

          {categoryProducts.length > 0 && (
            <Panel
              title={t('fields.productsCount')}
              actions={
                category._count.products > PREVIEW_LIMIT ? (
                  <PanelViewAll
                    to="/products"
                    state={filterState}
                    label={t('viewAll')}
                    count={category._count.products}
                  />
                ) : undefined
              }>
              <div className="divide-border divide-y">
                {categoryProducts.map((product) => (
                  <ListLink key={product.id} to={`/products/${product.id}`} state={listState}>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar size="sm" className="shrink-0">
                        {product.image ? <AvatarImage src={product.image} alt={product.name} /> : null}
                        <AvatarFallback>{product.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{product.name}</p>
                        <p className="text-muted-foreground text-xs">{product.unit}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-semibold">{fmtTJS(product.price)}</p>
                      <p className="text-muted-foreground font-mono text-xs">
                        {product.quantity} {t('unit.' + product.unit, { ns: 'products' })}
                      </p>
                    </div>
                  </ListLink>
                ))}
              </div>
            </Panel>
          )}
        </div>

        <div className="space-y-4">
          {market && <MarketCard market={market} t={t} viewState={listState} />}

          <QuickActions
            title={t('quickActions')}
            actions={[
              ...(can(Action.CATEGORIES_MANAGE)
                ? [
                    {
                      icon: Pencil,
                      label: t('actions.edit'),
                      variant: 'outline' as const,
                      onClick: () => editModal.open(category),
                    },
                  ]
                : []),
              {
                icon: Package,
                label: t('fields.productsCount'),
                render: <Link to="/products" state={filterState} />,
              },
              {
                icon: Store,
                label: t('fields.market'),
                render: <Link to={`/markets/${category.marketId}`} />,
              },
            ]}
          />
        </div>
      </div>

      <EditCategoryModal />
    </div>
  );
}
