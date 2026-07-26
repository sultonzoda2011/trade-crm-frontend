import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, Package, Pencil, Store } from 'lucide-react';
import { useMemo, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { categoriesApi } from '~/api/categories';
import { marketsApi } from '~/api/markets';
import { productsApi } from '~/api/products';
import { Panel } from '~/components/layout/Panel';
import { EditCategoryModal } from '~/components/modals/EditCategoryModal';
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
import { useCategoriesModals } from '../store';

interface StatCardProps extends ComponentProps<typeof Link> {
  icon: LucideIcon;
  label: string;
  value: number;
}

function StatCard({ icon: Icon, label, value, ...linkProps }: StatCardProps) {
  return (
    <Link
      {...linkProps}
      className="bg-muted/50 hover:bg-muted/80 flex flex-col items-center gap-1.5 rounded-xl p-4 transition-colors">
      <Icon className="text-muted-foreground size-4" />
      <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">{label}</span>
      <Badge variant="secondary" className="font-mono text-base">
        {value}
      </Badge>
    </Link>
  );
}

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Avatar className="size-16 rounded-xl">
              <AvatarImage
                src={category.image ?  category.image : undefined}
                className="object-cover"
              />
              <AvatarFallback className="bg-muted rounded-xl text-2xl font-semibold">
                {category.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
              {category.description && <p className="text-muted-foreground text-sm">{category.description}</p>}
            </div>
          </div>
          {can(Action.CATEGORIES_MANAGE) && (
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
          )}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InfoItem label={t('fields.name')} value={category.name} />
              {category.description && <InfoItem label={t('fields.description')} value={category.description} />}
              <InfoItem
                label={t('fields.market')}
                value={
                  <Link
                    to={`/markets/${category.marketId}`}
                    className="group text-primary inline-flex items-center gap-1 text-sm font-semibold hover:underline">
                    {market?.name ?? category.marketId}
                    <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
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
                state={{ fromCategoryId: category.id, fromCategoryName: category.name }}
              />
            </div>
          </Panel>

          {categoryProducts.length > 0 && (
            <Panel
              title={t('fields.productsCount')}
              actions={
                <Link
                  to="/products"
                  state={{ fromCategoryId: category.id, fromCategoryName: category.name }}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium transition-colors">
                  {t('viewAll')} ({category._count.products})
                  <ArrowUpRight className="size-3" />
                </Link>
              }>
              <div className="divide-border divide-y">
                {categoryProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    state={{ fromPath: location.pathname, fromName: category.name }}
                    className="hover:bg-muted/40 -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2.5 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <p className="text-muted-foreground text-xs">{product.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-semibold">{fmtTJS(product.price)}</p>
                      <p className="text-muted-foreground font-mono text-xs">
                        {product.quantity} {t('unit.' + product.unit, { ns: 'products' })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </Panel>
          )}
        </div>

        <div className="space-y-6">
          <Panel title={t('fields.market')}>
            <InfoItem
              label={t('fields.name')}
              value={
                <Link
                  to={`/markets/${category.marketId}`}
                  className="group text-primary inline-flex items-center gap-1 text-sm font-semibold hover:underline">
                  {market?.name ?? category.marketId}
                  <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              }
            />
          </Panel>

          <Panel title={t('quickActions')}>
            <div className="space-y-2">
              {can(Action.CATEGORIES_MANAGE) && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  size="sm"
                  onClick={() => editModal.open(category)}>
                  <Pencil className="size-3.5" />
                  {t('actions.edit')}
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                size="sm"
                render={
                  <Link to="/products" state={{ fromCategoryId: category.id, fromCategoryName: category.name }} />
                }>
                <Package className="size-3.5" />
                {t('fields.productsCount')}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                size="sm"
                render={<Link to={`/markets/${category.marketId}`} />}>
                <Store className="size-3.5" />
                {t('fields.market')}
              </Button>
            </div>
          </Panel>
        </div>
      </div>

      <EditCategoryModal />
    </div>
  );
}
