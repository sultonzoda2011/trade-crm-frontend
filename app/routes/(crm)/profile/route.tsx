import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  CloudDownload,
  KeyRound,
  LogOut,
  Monitor,
  Moon,
  Pencil,
  Store,
  Sun,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { profileApi } from '~/api/profile';
import { EarningsSection } from '~/components/profile/EarningsSection';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { EntityAvatar } from '~/components/shared/EntityAvatar';
import { ListGroup, ListRow } from '~/components/shared/ListGroup';
import { SegmentedControl } from '~/components/shared/SegmentedControl';
import { Badge } from '~/components/ui/badge';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { ROLE_CONFIG } from '~/config/enumOptions';
import { useCan } from '~/hooks/useCan';
import { useLanguageCycle, LANGUAGE_ITEMS } from '~/hooks/useLanguageCycle';
import { useLogout } from '~/hooks/useLogout';
import { formatDate } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';

type ThemeValue = 'light' | 'dark' | 'system';

/**
 * Профиль — экран «Настройки» как в iOS: сверху человек (фото, имя, роль), ниже
 * группы: заработок (только продавцу), аккаунт, рынок, приложение, безопасность
 * и выход. Рабочие списки (продажи, товары, должники) отсюда убраны — они есть
 * в навигации; здесь только то, что относится к самому человеку.
 */
export default function ProfilePage() {
  const { t } = useTranslation(['profile', 'common']);
  const { can } = useCan();
  const { theme, setTheme } = useTheme();
  const { currentLanguage, setLanguage } = useLanguageCycle();
  const { requestLogout, logoutDialog } = useLogout();

  const { data: response, isLoading } = useQuery({
    queryKey: queryKeys.profile(),
    queryFn: () => profileApi.getFullProfile(),
    staleTime: 30_000,
  });

  const profile = response?.data?.profile;
  const market = response?.data?.market ?? null;
  const earnings = response?.data?.earnings ?? null;

  if (isLoading) return <ByIdSkeleton />;

  if (!profile) {
    return (
      <div className="flex h-100 flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">{t('loadError')}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t('actions.retry')}
        </Button>
      </div>
    );
  }

  const roleConfig = ROLE_CONFIG[profile.role];
  const fromState = { fromPath: '/profile', fromName: t('title') };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col space-y-5 pb-6 md:max-w-xl">
      <BreadCrumbs items={[{ label: t('navigation.dashboard', { ns: 'common' }), link: '/dashboard' }, { label: t('title') }]} />

      {/* Человек: фото, имя, роль. Тап по карточке — к редактированию. */}
      <section className="bg-card relative overflow-hidden rounded-2xl p-5 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(90% 120% at 50% 0%, color-mix(in srgb, var(--primary) 12%, transparent), transparent 70%)',
          }}
        />
        <div className="relative flex flex-col items-center gap-3">
          <EntityAvatar name={profile.name} image={profile.image} size="xl" className="size-24 text-4xl" />
          <div className="min-w-0 space-y-1.5">
            <h1 className="text-2xl leading-tight font-bold tracking-tight break-words">{profile.name}</h1>
            <p className="text-muted-foreground text-sm break-words">{profile.email}</p>
            <Badge variant="outline" className={roleConfig?.className}>
              {roleConfig ? roleConfig.label(t) : profile.role}
            </Badge>
          </div>
          <Button variant="secondary" size="sm" render={<Link to="/profile/edit" />}>
            <Pencil />
            {t('editProfile')}
          </Button>
        </div>
      </section>

      {can(Action.PROFILE_EARNINGS) && earnings && <EarningsSection earnings={earnings} />}

      <ListGroup title={t('sections.account')}>
        <ListRow title={t('fields.name')} value={profile.name} to="/profile/edit" />
        <ListRow title={t('fields.email')} value={profile.email} to="/profile/edit" />
        <ListRow
          title={t('fields.phone')}
          value={profile.phone || t('notSet')}
          valueClassName={profile.phone ? undefined : 'text-muted-foreground/70'}
          to="/profile/edit"
        />
        <ListRow title={t('fields.createdAt')} value={formatDate(profile.createdAt)} />
      </ListGroup>

      {market && (
        <ListGroup title={t('sections.market')}>
          <ListRow
            leading={<EntityAvatar name={market.name} image={market.image} size="sm" shape="square" icon={Store} />}
            title={market.name}
            subtitle={market.address}
            to={can(Action.MARKETS_VIEW_BY_ID) ? `/markets/${market.id}` : undefined}
            state={fromState}
          />
        </ListGroup>
      )}

      <ListGroup title={t('sections.app')}>
        <ListRow
          title={t('fields.theme')}
          trailing={
            <SegmentedControl<ThemeValue>
              className="w-44 shrink-0"
              value={(theme as ThemeValue | undefined) ?? 'system'}
              onChange={setTheme}
              options={[
                { value: 'light', label: '', icon: Sun, ariaLabel: t('theme.light') },
                { value: 'dark', label: '', icon: Moon, ariaLabel: t('theme.dark') },
                { value: 'system', label: '', icon: Monitor, ariaLabel: t('theme.system') },
              ]}
            />
          }
        />
        <ListRow
          title={t('fields.language')}
          trailing={
            <SegmentedControl
              className="w-44 shrink-0"
              value={currentLanguage.value}
              onChange={setLanguage}
              options={LANGUAGE_ITEMS.map((item) => ({ value: item.value, label: item.shortLabel }))}
            />
          }
        />
        <ListRow leading={<CloudDownload className="text-primary size-5" />} title={t('sync')} to="/sync" />
        <ListRow leading={<BookOpen className="text-primary size-5" />} title={t('guide')} to="/guide" />
      </ListGroup>

      <ListGroup
        title={t('sections.security')}
        footer={t(profile.passwordChangedAt ? 'passwordHintChanged' : 'passwordHintNever', {
          date: profile.passwordChangedAt ? formatDate(profile.passwordChangedAt) : '',
        })}>
        <ListRow
          leading={<KeyRound className="text-primary size-5" />}
          title={t('sections.password')}
          value={profile.passwordChangedAt ? formatDate(profile.passwordChangedAt) : t('passwordNever')}
          to="/profile/password"
        />
      </ListGroup>

      <ListGroup>
        <ListRow
          leading={<LogOut className="size-5" />}
          title={t('logout', { ns: 'auth' })}
          destructive
          onClick={requestLogout}
        />
      </ListGroup>

      {logoutDialog}
    </div>
  );
}
