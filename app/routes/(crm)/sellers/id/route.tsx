import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { sellersApi } from '~/api/sellers';
import { Panel } from '~/components/layout/Panel';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { InfoItem } from '~/components/shared/InfoItem';
import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { formatDate } from '~/lib/format';
import { Role } from '~/types/common';

export default function SellerDetailPage() {
  const { t } = useTranslation(['sellers', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: response, isLoading } = useQuery({
    queryKey: ['seller', id],
    queryFn: () => sellersApi.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const seller = response?.data;

  if (isLoading) return <ByIdSkeleton />;

  if (!seller) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">{t('notFound')}</p>
        <Button variant="outline" onClick={() => navigate('/sellers')}>
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
          { link: location.state?.fromPath, label: location.state?.fromName || t('navigation.sellers') },
          { label: seller.name },
        ]}
      />

      <Panel className="p-6">
        <div className="flex items-center gap-5">
          <Avatar className="size-16 rounded-xl">
            <AvatarFallback className="bg-muted rounded-xl text-2xl font-semibold">
              {seller.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{seller.name}</h1>
            </div>
            <p className="text-muted-foreground text-sm">{seller.email}</p>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InfoItem label={t('fields.name')} value={seller.name} />
              <InfoItem label={t('fields.email')} value={seller.email} />

              <InfoItem label={t('fields.createdAt')} value={formatDate(seller.createdAt, true)} />
            </div>
          </Panel>
        </div>

        {seller.market && (
          <div className="space-y-6">
            <Panel title={t('fields.market')}>
              <div className="space-y-4">
                <InfoItem
                  label={t('fields.name')}
                  value={
                    <Link
                      to={`/markets/${seller.market.id}`}
                      className="group text-primary inline-flex items-center gap-1 text-sm font-semibold hover:underline">
                      {seller.market.name}
                      <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  }
                />
                {seller.market.address && <InfoItem label={t('fields.address')} value={seller.market.address} />}
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}
