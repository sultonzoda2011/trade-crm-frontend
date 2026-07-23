import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { debtorsApi } from '~/api/debtors';
import { Panel } from '~/components/layout/Panel';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { InfoItem } from '~/components/shared/InfoItem';
import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { formatDate } from '~/lib/format';

export default function DebtorDetailPage() {
  const { t } = useTranslation(['debtors', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: response, isLoading } = useQuery({
    queryKey: ['debtor', id],
    queryFn: () => debtorsApi.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const debtor = response?.data;

  if (isLoading) return <ByIdSkeleton />;

  if (!debtor) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">{t('notFound')}</p>
        <Button variant="outline" onClick={() => navigate('/debtors')}>
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
          { link: location.state?.fromPath, label: location.state?.fromName || t('navigation.debtors') },
          { label: debtor.name },
        ]}
      />

      <Panel className="p-6">
        <div className="flex items-center gap-5">
          <Avatar className="size-16 rounded-xl">
            <AvatarFallback className="bg-muted rounded-xl text-2xl font-semibold">
              {debtor.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1.5">
            <p className="text-muted-foreground text-sm">{debtor.phone}</p>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InfoItem label={t('fields.name')} value={debtor.name} />
              <InfoItem label={t('fields.phone')} value={debtor.phone} />
              <InfoItem label={t('fields.createdAt')} value={formatDate(debtor.createdAt, true)} />
              <InfoItem label={t('fields.updatedAt')} value={formatDate(debtor.updatedAt, true)} />
              <InfoItem label={t('fields.transactions')} value={debtor._count.transactions.toLocaleString()} />
            </div>
          </Panel>
        </div>

        {debtor.market && (
          <div className="space-y-6">
            <Panel title={t('fields.market')}>
              <div className="space-y-4">
                <InfoItem
                  label={t('fields.name')}
                  value={
                    <Link
                      to={`/markets/${debtor.market.id}`}
                      className="group text-primary inline-flex items-center gap-1 text-sm font-semibold hover:underline">
                      {debtor.market.name}
                      <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  }
                />
                {debtor.market.address && <InfoItem label={t('fields.address')} value={debtor.market.address} />}
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}
