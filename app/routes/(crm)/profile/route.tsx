import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Lock, Package, Pencil, ReceiptText, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { marketsApi } from '~/api/markets';
import { profileApi } from '~/api/profile';
import { ChangePasswordModal } from '~/components/modals/ChangePasswordModal';
import { EditProfileModal } from '~/components/modals/EditProfileModal';
import { Panel } from '~/components/layout/Panel';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { DetailHeader } from '~/components/shared/DetailHeader';
import { InfoItem } from '~/components/shared/InfoItem';
import { InfoLink } from '~/components/shared/InfoLink';
import { QuickActions } from '~/components/shared/QuickActions';
import { StatCard } from '~/components/shared/StatCard';
import { UserAvatar } from '~/components/shared/UserAvatar';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { Link } from 'react-router';
import { ROLE_CONFIG } from '~/config/enumOptions';
import { getUserFromToken } from '~/lib/auth-utils';
import { formatDate } from '~/lib/format';
import { useProfileModals } from './store';

export default function ProfilePage() {
  const { t } = useTranslation(['profile', 'common']);
  const location = useLocation();
  const editModal = useProfileModals((s) => s.edit);
  const passwordModal = useProfileModals((s) => s.password);

  const { data: response, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.getProfile(),
    staleTime: 30_000,
  });

  const profile = response?.data;
  const user = getUserFromToken();
  const fromState = { fromPath: location.pathname, fromName: t('title') };

  const { data: marketResponse } = useQuery({
    queryKey: ['profile-market', user?.marketId],
    queryFn: () => marketsApi.getById(user?.marketId!),
    enabled: !!user?.marketId,
    staleTime: 30_000,
  });

  const market = marketResponse?.data;

  if (isLoading) return <ByIdSkeleton />;
  if (!profile) return null;

  const roleBadge = (
    <Badge variant="outline" className={ROLE_CONFIG[profile.role]?.className}>
      {ROLE_CONFIG[profile.role] ? ROLE_CONFIG[profile.role].label(t) : profile.role}
    </Badge>
  );

  return (
    <div className="flex flex-1 flex-col space-y-6 pb-8">
      <BreadCrumbs items={[{ label: t('navigation.dashboard', { ns: 'common' }), link: '/' }, { label: t('title') }]} />

      <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel className="p-6">
            <DetailHeader
              name={profile.name}
              subtitle={profile.email}
              image={profile.image}
              badges={roleBadge}
              actions={
                <Button variant="outline" size="sm" className="gap-2" onClick={() => editModal.open(profile)}>
                  <Pencil className="size-3.5" />
                  <span className="hidden sm:inline">{t('editProfile')}</span>
                </Button>
              }
            />
          </Panel>

          <Panel title={t('sections.profile')}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <InfoItem label={t('fields.role')} value={roleBadge} />
              <InfoItem label={t('fields.email')} value={profile.email} />
              <InfoItem label={t('fields.createdAt')} value={formatDate(profile.createdAt, true)} />
            </div>
          </Panel>

          <Panel title={t('sections.market')}>
            {market ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <InfoItem
                  label={t('fields.market')}
                  value={
                    <span className="flex items-center gap-2">
                      <Avatar size="sm" className="shrink-0">
                        {market.image ? <AvatarImage src={market.image} alt={market.name} /> : null}
                        <AvatarFallback>{market.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <InfoLink to={`/markets/${market.id}`} state={fromState}>
                        {market.name}
                      </InfoLink>
                    </span>
                  }
                />
                <InfoItem label={t('fields.address')} value={market.address} />
                <InfoItem label={t('fields.createdAt')} value={formatDate(market.createdAt, true)} />
                <InfoItem label={t('fields.updatedAt')} value={formatDate(market.updatedAt, true)} />
              </div>
            ) : (
              <p className="text-muted-foreground py-4 text-center text-sm">{t('noMarket')}</p>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          {market && (
            <Panel title={t('sections.market')}>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 shrink-0 rounded-lg">
                    {market.image ? <AvatarImage src={market.image} alt={market.name} /> : null}
                    <AvatarFallback className="bg-muted rounded-lg">
                      {market.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{market.name}</p>
                    <p className="text-muted-foreground truncate text-xs">{market.address}</p>
                  </div>
                </div>
                <UserAvatar
                  fullName={market.owner.name}
                  subInfo={market.owner.email}
                  imagePath={market.owner.image ?? undefined}
                />
                <div className="grid grid-cols-3 gap-3">
                  <StatCard
                    size="sm"
                    icon={Package}
                    label={t('fields.products')}
                    value={market.count.products}
                    to="/products"
                    state={fromState}
                  />
                  <StatCard
                    size="sm"
                    icon={Users}
                    label={t('fields.debtors')}
                    value={market.count.debtors}
                    to="/debtors"
                    state={fromState}
                  />
                  <StatCard
                    size="sm"
                    icon={ReceiptText}
                    label={t('fields.transactions')}
                    value={market.count.transactions}
                    to="/transactions"
                    state={fromState}
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  size="sm"
                  render={<Link to={`/markets/${market.id}`} state={fromState} />}>
                  {t('goToMarket')}
                  <ArrowUpRight className="size-3.5" />
                </Button>
              </div>
            </Panel>
          )}

          <QuickActions
            title={t('quickActions')}
            actions={[
              { icon: Pencil, label: t('editProfile'), variant: 'outline', onClick: () => editModal.open(profile) },
              { icon: Lock, label: t('sections.password'), onClick: () => passwordModal.open() },
            ]}
          />
        </div>
      </div>

      <EditProfileModal />
      <ChangePasswordModal />
    </div>
  );
}
