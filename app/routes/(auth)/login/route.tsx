import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
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
import { runSync } from '~/lib/offline/syncEngine';
import { cn } from '~/lib/utils';
import { Role } from '~/types/common';
import { createLoginSchema, type LoginForm } from '~/validations/auth';
import textInRightDark from '/text-in-right-logo-dark.png';
import textInRightLight from '/text-in-right-logo-light.png';

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

  const schema = createLoginSchema(tVal);

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
      // Первый после логина токен — самое время забрать офлайн-снапшот
      // (products/categories/debtors/transactions), не дожидаясь события
      // сети/resume: до этого useSyncEngine на root.tsx уже пытался
      // синкнуться при старте приложения БЕЗ токена и получил 401, а без
      // повторного триггера так и остался бы с пустым локальным кэшем.
      void runSync();
      toast.success(t('loginSuccess'));
      const redirectTo = searchParams.get('redirectTo') || '/';

      try {
        const path = getRedirectPath(user.role, redirectTo);
        navigate(path);
      } catch {
        navigate('/');
      }
    },
    onError: (error: any) => {
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
      <div className="bg-foreground text-background relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        {/* Ambient brand depth so the panel isn't a flat black slab */}
        <div
          aria-hidden
          className="bg-primary/25 pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full blur-[120px]"
        />
        <div
          aria-hidden
          className="bg-primary/20 pointer-events-none absolute -right-20 -bottom-16 h-80 w-80 rounded-full blur-[120px]"
        />

        <div className="relative flex items-center">
          <img className="h-12 w-auto object-contain dark:hidden" src={textInRightDark} alt="Trade CRM" />
          <img className="hidden h-12 w-auto object-contain dark:block" src={textInRightLight} alt="Trade CRM" />
        </div>

        <div className="relative max-w-md space-y-5">
          <h1 className="text-4xl leading-[1.12] font-bold tracking-tight text-balance">{t('heroTitle')}</h1>
          <p className="text-background/70 text-lg leading-relaxed">{t('heroDescription')}</p>
        </div>

        <div className="relative flex items-center gap-2">
          {(['w-4', 'w-8', 'w-12', 'w-16'] as const).map((w, i) => (
            <div key={i} className={cn('bg-background/20 h-1 rounded-full', w)} />
          ))}
          <div className="bg-primary h-1 w-24 rounded-full" />
        </div>
      </div>

      {/* ── Auth form ───────────────────────────────────────────────── */}
      <div className="bg-muted/30 scrollbar-thin relative flex min-h-0 flex-col overflow-y-auto">
        {/* Ambient brand glow — тонко в светлой теме, насыщеннее в тёмной; за непрозрачной карточкой */}
        <div
          aria-hidden
          className="bg-primary/10 dark:bg-primary/20 pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full blur-[130px]"
        />
        <div
          aria-hidden
          className="bg-primary/5 dark:bg-primary/15 pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full blur-[130px]"
        />

        <div className="relative flex flex-1 items-center justify-center px-4 py-6 sm:px-8">
          <div className="w-full max-w-sm space-y-6">
            {/* Logo — mobile only; the hero carries it on desktop */}
            <div className="flex justify-center lg:hidden">
              <img className="h-15 w-auto object-contain dark:hidden" src={textInRightLight} alt="Trade CRM" />
              <img className="hidden h-15 w-auto object-contain dark:block" src={textInRightDark} alt="Trade CRM" />
            </div>

            <div className="bg-card ring-foreground/10 rounded-2xl p-6 shadow-lg ring-1 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-bold tracking-tight">{t('signIn')}</h2>

                  <p className="text-muted-foreground text-sm">{t('welcome')}</p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <LanguageSwitcher />
                  <ModeToggle />
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                <FormInput
                  control={control}
                  name="email"
                  label={t('email')}
                  placeholder={t('emailPlaceholder')}
                  type="email"
                />
                <FormInput
                  control={control}
                  name="password"
                  label={t('password')}
                  placeholder={t('passwordPlaceholder')}
                  type={showPassword ? 'text' : 'password'}
                  endIcon={
                    showPassword ? (
                      <EyeOff className="h-4 w-4 cursor-pointer" onClick={() => setShowPassword(!showPassword)} />
                    ) : (
                      <Eye className="h-4 w-4 cursor-pointer" onClick={() => setShowPassword(!showPassword)} />
                    )
                  }
                />
                <div className="flex">
                  <button
                    type="button"
                    className="text-primary hover:text-primary/80 text-sm font-medium transition-colors">
                    {t('forgotPassword')}
                  </button>
                </div>

                <Button type="submit" size="lg" className="w-full text-sm font-semibold" disabled={isSubmitting}>
                  {isSubmitting ? t('submitting') : t('signIn')}
                </Button>
              </form>

              {/* Разделитель + вход через Google — визуальная заглушка (OAuth на бэкенде пока нет) */}
              <div className="my-5 flex items-center gap-3">
                <span className="bg-border h-px flex-1" />
                <span className="text-muted-foreground text-xs">{t('or')}</span>
                <span className="bg-border h-px flex-1" />
              </div>

              <Button type="button" variant="outline" size="lg" className="w-full gap-2 text-sm font-medium">
                <GoogleIcon className="h-4 w-4" />
                {t('continueWithGoogle')}
              </Button>
            </div>
          </div>
        </div>

        <p className="text-muted-foreground px-4 pb-6 text-center text-xs">
          © {new Date().getFullYear()} TradeCRM. {t('allRightsReserved')}
        </p>
      </div>
    </>
  );
}
