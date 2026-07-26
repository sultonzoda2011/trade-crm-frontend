import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Pencil, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { productsApi } from '~/api/products';
import { Panel } from '~/components/layout/Panel';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { InfoItem } from '~/components/shared/InfoItem';
import { UserAvatar } from '~/components/shared/UserAvatar';
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
      <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">{t('notFound')}</p>
        <Button variant="outline" onClick={() => navigate('/products')}>
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
          { label: product.name },
        ]}
      />

      <Panel className="p-6">
        <div className="flex items-center gap-5">
          <Avatar className="size-16 rounded-xl">
            <AvatarImage src={product.image ? product.image : undefined} className="object-cover" />
            <AvatarFallback className="bg-muted rounded-xl text-2xl font-semibold">
              {product.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
                {product.category && (
                  <Badge variant="secondary" className="font-normal">
                    {product.category.name}
                  </Badge>
                )}
                {product.quantity <= product.lowStockThreshold && (
                  <Badge variant="destructive" className="font-normal">
                    {t('lowStock', { defaultValue: 'Мало на складе' })}
                  </Badge>
                )}
              </div>
              {can(Action.PRODUCTS_EDIT) && (
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
              )}
            </div>
            <p className="text-muted-foreground text-sm">{product.market?.name}</p>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InfoItem label={t('fields.name')} value={product.name} />
              <InfoItem label={t('fields.description')} value={product.description} />
              <InfoItem label={t('fields.price')} value={fmtTJS(product.price)} />
              <InfoItem
                label={t('fields.quantity')}
                value={
                  <span className="flex items-center gap-2">
                    <span
                      className={
                        product.quantity <= product.lowStockThreshold ? 'text-destructive font-semibold' : undefined
                      }>
                      {product.quantity} {t(`unit.${product.unit}`, { defaultValue: product.unit })}
                    </span>
                    {product.quantity <= product.lowStockThreshold && (
                      <Badge variant="destructive" className="text-xs font-normal">
                        {t('lowStock', { defaultValue: 'Мало на складе' })}
                      </Badge>
                    )}
                  </span>
                }
              />
              <InfoItem label={t('fields.unit')} value={t(`unit.${product.unit}`, { defaultValue: product.unit })} />
              <InfoItem
                label={t('fields.lowStockThreshold')}
                value={`${product.lowStockThreshold} ${t(`unit.${product.unit}`, { defaultValue: product.unit })}`}
              />
              <InfoItem label={t('fields.category')} value={product.category?.name ?? '—'} />
              <InfoItem
                label={t('fields.market')}
                value={
                  <Link
                    to={`/markets/${product.marketId}`}
                    className="group text-primary inline-flex items-center gap-1 text-sm font-semibold hover:underline">
                    {product.market?.name}
                    <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                }
              />
              <InfoItem label={t('fields.createdAt')} value={formatDate(product.createdAt, true)} />
              <InfoItem label={t('fields.updatedAt')} value={formatDate(product.updatedAt, true)} />
            </div>
          </Panel>

          <Panel title={t('statistics')}>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-muted/50 flex flex-col items-center gap-1.5 rounded-xl p-4">
                <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  {t('fields.transactionItems')}
                </span>
                <Badge variant="secondary" className="font-mono text-base">
                  {product._count.transactionItems}
                </Badge>
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title={t('fields.market')}>
            <div className="space-y-4">
              <UserAvatar fullName={product.market?.name} subInfo={product.market?.address} />
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                render={
                  <Link
                    to={`/markets/${product.marketId}`}
                    state={{ fromPath: location.pathname, fromName: t('title') }}
                  />
                }>
                {t('actions.view')}
                <ArrowUpRight className="size-3.5" />
              </Button>
            </div>
          </Panel>

          <Panel title={t('quickActions', { defaultValue: 'Быстрые действия' })}>
            <div className="space-y-2">
              {can(Action.PRODUCTS_EDIT) && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  size="sm"
                  render={<Link to={`/products/${product.id}/edit`} />}>
                  <Pencil className="size-3.5" />
                  {t('actions.edit')}
                </Button>
              )}
              {product.market && (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  size="sm"
                  render={<Link to={`/markets/${product.marketId}`} />}>
                  <Store className="size-3.5" />
                  {t('fields.market')}
                </Button>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
