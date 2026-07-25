import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { marketsApi } from '~/api/markets';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { InfoItem } from '~/components/shared/InfoItem';
import { Panel } from '~/components/layout/Panel';
import { formatDate } from '~/lib/format';
import { UserAvatar } from '~/components/shared/UserAvatar';

export default function MarketDetailPage() {
  const { t } = useTranslation(['markets', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: response, isLoading } = useQuery({
    queryKey: ['market', id],
    queryFn: () => marketsApi.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const market = response?.data;

  if (isLoading) return <ByIdSkeleton />;

  if (!market) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">{t('notFound')}</p>
        <Button variant="outline" onClick={() => navigate('/markets')}>
          {t('actions.back', { ns: 'common' })}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col space-y-6 pb-8">
      <BreadCrumbs
        items={[
          { label: t('navigation.dashboard'), link: '/' },
          { link: location.state?.fromPath, label: location.state?.fromName || t('title') },
          { label: market.name },
        ]}
      />

      <Panel className="p-6">
        <div className="flex items-center gap-5">
          <Avatar className="size-16 rounded-xl">
            <AvatarImage
              src={market.image ? import.meta.env.VITE_API_URL + market.image : undefined}
              className="object-cover"
            />
            <AvatarFallback className="bg-muted rounded-xl text-2xl font-semibold">
              {market.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{market.name}</h1>
            </div>
            <p className="text-muted-foreground text-sm">{market.address}</p>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InfoItem label={t('fields.name')} value={market.name} />
              <InfoItem label={t('fields.address')} value={market.address} />
              <InfoItem
                label={t('fields.owner')}
                value={
                  <Link
                    to={`/users/${market.ownerId}`}
                    className="group text-primary inline-flex items-center gap-1 text-sm font-semibold hover:underline">
                    {market.owner.name}
                    <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                }
              />
              <InfoItem label={t('fields.createdAt')} value={formatDate(market.createdAt, true)} />
              <InfoItem label={t('fields.updatedAt')} value={formatDate(market.updatedAt, true)} />
            </div>
          </Panel>

          <Panel title={t('statistics')}>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted/50 flex flex-col items-center gap-1.5 rounded-xl p-4">
                <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  {t('fields.products')}
                </span>
                <Badge variant="secondary" className="font-mono text-base">
                  {market.count.products}
                </Badge>
              </div>
              <div className="bg-muted/50 flex flex-col items-center gap-1.5 rounded-xl p-4">
                <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  {t('fields.debtors')}
                </span>
                <Badge variant="secondary" className="font-mono text-base">
                  {market.count.debtors}
                </Badge>
              </div>
              <div className="bg-muted/50 flex flex-col items-center gap-1.5 rounded-xl p-4">
                <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  {t('fields.transactions')}
                </span>
                <Badge variant="secondary" className="font-mono text-base">
                  {market.count.transactions}
                </Badge>
              </div>
            </div>
          </Panel>

          {/* Бэкенд включает users[] (сотрудников маркета, включая владельца) в
              ответ детальной страницы — раньше этот список не показывался вообще. */}
          <Panel title={t('fields.employees', { defaultValue: 'Сотрудники' })}>
            {market.users.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                {t('noEmployees', { defaultValue: 'Пока нет сотрудников' })}
              </p>
            ) : (
              <div className="divide-y divide-border">
                {market.users.map((employee) => (
                  <Link
                    key={employee.id}
                    to={employee.role === 'SELLER' ? `/sellers/${employee.id}` : `/users/${employee.id}`}
                    state={{ fromPath: location.pathname, fromName: market.name }}
                    className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-3 transition-colors hover:bg-muted/40">
                    <UserAvatar fullName={employee.name} subInfo={employee.email} />
                    <div className="flex items-center gap-2">
                      {employee.id === market.ownerId && (
                        <Badge variant="secondary" className="text-xs font-normal">
                          {t('fields.owner')}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs font-normal">
                        {employee.role}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title={t('fields.owner')}>
            <div className="space-y-4">
              <UserAvatar fullName={market.owner.name} subInfo={market.owner.email} />
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                render={
                  <Link to={`/users/${market.ownerId}`} state={{ fromPath: location.pathname, fromName: t('title') }} />
                }>
                {t('actions.view')}
                <ArrowUpRight className="size-3.5" />
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
