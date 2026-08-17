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
import { StatCard } from '~/components/shared/StatCard'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { Action } from '~/config/actions';
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

  return (
    <div className="flex flex-1 flex-col space-y-6 pb-8">
      <BreadCrumbs
        items={[
          { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
          { link: location.state?.fromPath, label: location.state?.fromName || t('title') },
          { label: product.name },
        ]}
      />

      <Panel className="p-6">
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
              {isLowStock && (
                <Badge variant="destructive" className="font-normal">
                  {t('lowStock')}
                </Badge>
              )}
            </>
          }
          actions={
            can(Action.PRODUCTS_EDIT) ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button variant="outline" size="sm" render={<Link to={`/products/${product.id}/edit`} />}>
                      <Pencil className="mr-1 size-4" />
                      {t('actions.edit')}
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

          <Panel title={t('statistics')}>
            <Link to={`/transactions?productId=${product.id}`}>
              <div className="grid grid-cols-1 gap-4">
                <StatCard icon={Package} label={t('fields.transactionItems')} value={product._count.transactionItems} />
              </div>
            </Link>
          </Panel>
        </div>

        <div className="space-y-6">
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
