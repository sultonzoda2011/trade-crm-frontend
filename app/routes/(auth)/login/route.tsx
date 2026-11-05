import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { redirect, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { authApi } from '~/api/auth';
import { LanguageSwitcher } from '~/components/layout/LanguageSwitcher';
import { ModeToggle } from '~/components/layout/ModeToggle';
import { Button } from '~/components/ui/button';
import { FormInput } from '~/components/ui/form/FormInput';
import { canAccess } from '~/config/permissions';
import { useForm } from '~/hooks/useForm';
import { getClientUser, setAccessToken, setUserInfo, type UserInfo } from '~/lib/auth-utils';
import { cn } from '~/lib/utils';
import { Role } from '~/types/common';
import { createLoginSchema, type LoginForm } from '~/validations/auth';
import darkLogo from '/logo-text-in-left-dark.png';
import lightLogo from '/logo-text-in-left-light.png';

/** Официальный многоцветный логотип Google «G». */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

/**
 * Ненавязчивый фоновый слой с мягкими кривыми и лёгким голубым свечением.
 * Не перетягивает внимание с карточки входа и адаптируется к светлой и тёмной теме.
 */
function AuthBackgroundDecoration() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {/* Мягкое радиальное свечение за брендом и карточкой */}
      <div className="bg-primary/[0.06] dark:bg-primary/[0.14] absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full blur-[110px]" />

      {/* Верхняя плавная кривая справа (как на референсе) */}
      <svg
        className="text-primary/[0.045] dark:text-primary/[0.07] absolute top-0 right-0 h-[62%] w-[78%] max-w-[560px]"
        viewBox="0 0 400 500"
        fill="none"
        preserveAspectRatio="none">
        <path d="M90 0C40 150 110 310 400 410V0H90Z" fill="currentColor" />
        <path
          d="M210 0C165 120 225 260 400 330V0H210Z"
          fill="currentColor"
          className="text-primary/[0.035] dark:text-primary/[0.05]"
        />
      </svg>

      {/* Нижние мягкие волны */}
      <svg
        className="absolute inset-x-0 bottom-0 h-36 w-full sm:h-44"
        viewBox="0 0 800 180"
        fill="none"
        preserveAspectRatio="none">
        <path
          d="M0 135C190 100 390 120 620 165C700 180 760 175 800 165V180H0V135Z"
          className="fill-primary/[0.05] dark:fill-primary/[0.07]"
        />
        <path d="M430 180C565 125 690 88 800 68V180H430Z" className="fill-primary/[0.09] dark:fill-primary/[0.11]" />
      </svg>
    </div>
  );
}

const AUTH_INPUT_CLASS = cn(
  'space-y-2 px-0',
  '[&_[data-slot=label]]:text-foreground [&_[data-slot=label]]:text-[15px] [&_[data-slot=label]]:font-semibold',
  '[&_[data-slot=input-group]]:h-[52px] md:[&_[data-slot=input-group]]:h-12',
  '[&_[data-slot=input-group]]:rounded-[14px]',
  'dark:[&_[data-slot=input-group]]:bg-input [&_[data-slot=input-group]]:bg-[#EFF2F7]',
  '[&_[data-slot=input-group]]:border [&_[data-slot=input-group]]:border-transparent',
  '[&_[data-slot=input-group]]:transition-all',
  '[&_[data-slot=input-group]:focus-within]:bg-card dark:[&_[data-slot=input-group]:focus-within]:bg-input/80',
  '[&_[data-slot=input-group]:focus-within]:border-primary/35',
  '[&_[data-align=inline-start]]:pr-1.5 [&_[data-align=inline-start]]:pl-4',
  '[&_[data-align=inline-end]]:pr-3',
  '[&_[data-slot=input-group-control]]:placeholder:text-muted-foreground/75 [&_[data-slot=input-group-control]]:text-[15px]'
);

export async function clientLoader() {
  const user = getClientUser();
  if (user) {
    return redirect('/');
  }
}

export default function LoginPage() {
  const { t } = useTranslation('auth');
  const { t: tVal } = useTranslation('validation');
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const schema = useMemo(() => createLoginSchema(tVal), [tVal]);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting: isFormSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const getRedirectPath = (role: Role, redirectTo: string): string => {
    if (role === Role.Seller) {
      return '/';
    }
    return canAccess(role, redirectTo) ? redirectTo : '/';
  };

  const { mutate, isPending } = useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      // Бэкенд возвращает accessToken в теле ответа — сохраняем сами
      // и дальше отправляем как Authorization: Bearer <token>.
      setAccessToken(response.data.accessToken);
      const user: UserInfo = {
        id: response.data.user.id,
        name: response.data.user.name,
        email: response.data.user.email,
        role: response.data.user.role as Role,
        marketId: response.data.user.marketId ?? '',
        image: null,
      };
      setUserInfo(user);
      toast.success(t('loginSuccess'));
      const redirectTo = searchParams.get('redirectTo') || '/';
      navigate(getRedirectPath(user.role, redirectTo));
    },
    onError: () => {
      toast.error(t('loginError'));
    },
  });

  const onSubmit = (data: LoginForm) => {
    mutate(data);
  };

  const isSubmitting = isFormSubmitting || isPending;

  return (
    <>
      {/* ── Brand hero — desktop only ───────────────────────────────── */}
      <div className="border-border/60 relative hidden flex-col justify-between overflow-hidden border-r bg-gradient-to-br from-[#EAF2FF] via-[#F3F7FC] to-[#E3EEFF] p-12 lg:flex xl:p-16 dark:from-[#0B1220] dark:via-[#0F172A] dark:to-[#090D16]">
        <div
          aria-hidden="true"
          className="bg-primary/12 dark:bg-primary/20 pointer-events-none absolute -top-28 -right-16 size-96 rounded-full blur-[120px]"
        />
        <div
          aria-hidden="true"
          className="bg-primary/8 dark:bg-primary/15 pointer-events-none absolute -bottom-24 -left-16 size-80 rounded-full blur-[120px]"
        />
        <svg
          aria-hidden="true"
          className="text-primary/[0.06] dark:text-primary/[0.08] pointer-events-none absolute inset-y-0 right-0 h-full w-3/4"
          viewBox="0 0 400 800"
          fill="none"
          preserveAspectRatio="none">
          <path d="M140 0C40 240 120 520 400 680V0H140Z" fill="currentColor" />
        </svg>

        <div className="relative flex items-center">
          <img className="h-12 w-auto object-contain select-none dark:hidden" src={lightLogo} alt="TradeCRM" />
          <img className="hidden h-12 w-auto object-contain select-none dark:block" src={darkLogo} alt="TradeCRM" />
        </div>

        <div className="relative max-w-md space-y-5">
          <h1 className="text-foreground text-4xl leading-[1.14] font-bold tracking-tight text-balance xl:text-[2.5rem]">
            {t('heroTitle')}
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">{t('heroDescription')}</p>
        </div>

        <div className="relative flex items-center gap-2">
          {(['w-4', 'w-8', 'w-12', 'w-16'] as const).map((w, i) => (
            <div key={i} className={cn('bg-primary/20 dark:bg-primary/25 h-1.5 rounded-full', w)} />
          ))}
          <div className="bg-primary h-1.5 w-24 rounded-full" />
        </div>
      </div>

      {/* ── Auth form column ────────────────────────────────────────── */}
      <div className="scrollbar-thin dark:bg-background relative flex min-h-dvh flex-col justify-between overflow-x-hidden overflow-y-auto bg-[#F4F7FC] pt-[max(1.5rem,var(--sat))] pb-[max(1.25rem,var(--sab))] lg:min-h-0">
        <AuthBackgroundDecoration />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
          <div className="w-full max-w-[400px] space-y-6 sm:space-y-7">
            {/* Brand section — mobile & tablet only; desktop shows left hero panel */}
            <div className="flex flex-col items-center text-center lg:hidden">
              <img
                className="h-12 w-auto object-contain select-none sm:h-13 dark:hidden"
                src={lightLogo}
                alt="TradeCRM"
              />
              <img
                className="hidden h-12 w-auto object-contain select-none sm:h-13 dark:block"
                src={darkLogo}
                alt="TradeCRM"
              />
              <p className="text-muted-foreground mt-2.5 max-w-[235px] text-[15px] leading-[1.35] font-normal">
                {t('brandTagline')}
              </p>
            </div>

            {/* White authentication card */}
            <div className="bg-card relative rounded-[24px] p-6 shadow-[0_12px_36px_-8px_rgba(15,23,42,0.07),0_2px_10px_-2px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.04] sm:p-8 dark:shadow-2xl dark:ring-white/[0.08]">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <h2 className="text-foreground text-[28px] leading-[1.15] font-bold tracking-tight sm:text-[30px]">
                    {t('signIn')}
                  </h2>
                  <p className="text-muted-foreground max-w-[215px] text-[15px] leading-[1.35] sm:max-w-none">
                    {t('welcome')}
                  </p>
                </div>

                {/* Compact Language & Theme pill */}
                <div className="bg-card dark:bg-elevated/90 flex shrink-0 items-center rounded-full p-1 shadow-[0_2px_10px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.06] dark:ring-white/[0.1]">
                  <LanguageSwitcher
                    variant="ghost"
                    className="size-9 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
                  />
                  <span aria-hidden="true" className="bg-border/80 mx-0.5 h-5 w-px" />
                  <ModeToggle
                    variant="ghost"
                    className="size-9 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
                  />
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                <FormInput
                  control={control}
                  name="email"
                  label={t('email')}
                  placeholder={t('emailPlaceholder')}
                  type="email"
                  autoComplete="email"
                  className={AUTH_INPUT_CLASS}
                  startIcon={<Mail className="text-muted-foreground/80 size-[19px]" strokeWidth={1.75} />}
                />

                <FormInput
                  control={control}
                  name="password"
                  label={t('password')}
                  placeholder={t('passwordPlaceholder')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={AUTH_INPUT_CLASS}
                  startIcon={<Lock className="text-muted-foreground/80 size-[19px]" strokeWidth={1.75} />}
                  endIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                      aria-pressed={showPassword}
                      className="text-muted-foreground/80 hover:text-foreground focus-visible:ring-ring/40 -mr-1 inline-flex size-9 cursor-pointer items-center justify-center rounded-lg transition-colors outline-none focus-visible:ring-2 active:opacity-60">
                      {showPassword ? (
                        <Eye className="size-[19px]" strokeWidth={1.75} />
                      ) : (
                        <EyeOff className="size-[19px]" strokeWidth={1.75} />
                      )}
                    </button>
                  }
                />

                <div className="flex pt-0.5">
                  <Button
                    type="button"
                    variant="link"
                    className="text-primary h-auto px-0 py-0.5 text-[15px] font-semibold hover:underline">
                    {t('forgotPassword')}
                  </Button>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  loading={isSubmitting}
                  className="hover:bg-primary/92 mt-1 h-[54px] w-full gap-2 rounded-[16px] text-base font-semibold shadow-[0_8px_20px_-4px_rgba(0,122,255,0.36)] md:h-12 md:text-[15px]">
                  <span>{t('signIn')}</span>
                  <ArrowRight
                    aria-hidden="true"
                    className="size-[18px] transition-transform duration-150 group-hover/button:translate-x-0.5 group-data-[loading]/button:hidden"
                    strokeWidth={2.25}
                  />
                </Button>
              </form>

              {/* Разделитель + вход через Google — визуальная заглушка (OAuth на бэкенде пока нет) */}
              <div className="my-5 flex items-center gap-4">
                <span className="bg-border/80 h-px flex-1" />
                <span className="text-muted-foreground text-xs font-medium">{t('or')}</span>
                <span className="bg-border/80 h-px flex-1" />
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="bg-card hover:bg-muted/50 dark:bg-elevated/60 dark:hover:bg-elevated border-border/80 text-foreground h-[52px] w-full gap-2.5 rounded-[16px] border text-[15px] font-semibold shadow-2xs md:h-12">
                <GoogleIcon className="size-5" />
                <span>{t('continueWithGoogle')}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative z-10 px-4 pt-2 pb-2 text-center">
          <p className="text-muted-foreground/85 text-xs leading-relaxed">
            © {new Date().getFullYear()} TradeCRM. {t('allRightsReserved')}
          </p>
        </footer>
      </div>
    </>
  );
}
