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
import { PanelViewAll } from '~/components/shared/PanelViewAll';
import { QuickActions } from '~/components/shared/QuickActions';
import { StatCard } from '~/components/shared/StatCard';
import { Badge } from '~/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { fmtTJS, formatDate } from '~/lib/format';
import { useCategoriesModals } from '../store';

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

  const { data: productsResponse } = useQuery({
    queryKey: ['category-products', id],
    queryFn: () => productsApi.getAll(1, 5, {}, [{ key: 'categoryId', value: id! }]),
    enabled: !!id,
    staleTime: 30_000,
  });

  const categoryProducts = useMemo(() => productsResponse?.data?.data ?? [], [productsResponse]);

  if (isLoading) return <ByIdSkeleton />;

  if (!category) {
    return (
      <div className="flex h-100 flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">{t('notFound')}</p>
        <Button variant="outline" onClick={() => navigate('/categories')}>
          {t('actions.back', { ns: 'common' })}
        </Button>
      </div>
    );
  }

  const listState = { fromPath: location.pathname, fromName: category.name };
  const filterState = { fromCategoryId: category.id, fromCategoryName: category.name };

  return (
    <div className="flex flex-1 flex-col space-y-6 pb-8">
      <BreadCrumbs
        items={[
          { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
          { link: location.state?.fromPath, label: location.state?.fromName || t('title') },
          { label: category.name },
        ]}
      />

      <Panel className="p-6">
        <DetailHeader
          name={category.name}
          subtitle={category.description ?? undefined}
          image={category.image}
          actions={
            can(Action.CATEGORIES_MANAGE) ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => editModal.open(category)}>
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

          <Panel title={t('statistics')}>
            <div className="grid grid-cols-3 gap-4">
              <StatCard
                icon={Package}
                label={t('fields.productsCount')}
                value={category._count.products}
                to="/products"
                state={filterState}
              />
            </div>
          </Panel>

          {categoryProducts.length > 0 && (
            <Panel
              title={t('fields.productsCount')}
              actions={
                <PanelViewAll
                  to="/products"
                  state={filterState}
                  label={t('viewAll')}
                  count={category._count.products}
                />
              }>
              <div className="divide-border divide-y">
                {categoryProducts.map((product) => (
                  <ListLink key={product.id} to={`/products/${product.id}`} state={listState} className="py-2.5">
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

        <div className="space-y-6">
          <Panel title={t('fields.market')}>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-9 shrink-0 rounded-lg">
                  {market?.image ? <AvatarImage src={market.image} alt={market.name} /> : null}
                  <AvatarFallback className="bg-muted rounded-lg">
                    {(market?.name ?? '?').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{market?.name ?? category.marketId}</p>
                  {market?.address && <p className="text-muted-foreground truncate text-xs">{market.address}</p>}
                </div>
              </div>
              <InfoLink to={`/markets/${category.marketId}`} state={listState}>
                {t('actions.view')}
              </InfoLink>
            </div>
          </Panel>

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
