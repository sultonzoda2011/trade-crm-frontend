import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
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
import { type DecodedToken, getAuthToken, getRefreshToken, isTokenExpired } from '~/lib/auth-utils';
import { cn } from '~/lib/utils';
import { Role } from '~/types/common';
import { createLoginSchema, type LoginForm } from '~/validations/auth';
import favicon from '/favicon.ico';

export async function clientLoader() {
  const token = getAuthToken();
  if (token && !isTokenExpired(token)) {
    return redirect('/');
  }

  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      const baseURL = (import.meta.env.VITE_API_URL || '') + '/api';
      const response = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      Cookies.set('token', accessToken, { expires: 7 });
      Cookies.set('refreshToken', newRefreshToken, { expires: 30 });
      return redirect('/');
    } catch {
      Cookies.remove('refreshToken');
    }
  }

  return {};
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
      Cookies.set('token', response.data.accessToken, { expires: 7 });
      Cookies.set('refreshToken', response.data.refreshToken, { expires: 30 });
      toast.success(t('loginSuccess'));
      const redirectTo = searchParams.get('redirectTo') || '/';

      try {
        const user = jwtDecode<DecodedToken>(response.data.accessToken);
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
      <div className="bg-foreground text-background hidden flex-col justify-between p-12 lg:flex">
        <div className="flex items-center text-2xl font-bold tracking-tight">
          <img className="w-20" src={favicon} alt="Trade Logo" />
          <span className="">TradeCRM</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl leading-tight font-bold">{t('heroTitle')}</h1>
          <p className="text-background/60 text-lg">{t('heroDescription')}</p>
        </div>
        <div className="flex gap-2">
          {(['w-4', 'w-8', 'w-12', 'w-16', 'w-20'] as const).map((w, i) => (
            <div key={i} className={cn('bg-background/20 h-1 rounded-full', w)} />
          ))}
        </div>
      </div>

      <div className="bg-background scrollbar-thin flex min-h-0 flex-col overflow-y-auto">
        <div className="flex justify-end gap-2 p-4">
          <LanguageSwitcher />
          <ModeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-8">
          <div className="w-full max-w-sm space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">{t('signIn')}</h2>
              <p className="text-muted-foreground">{t('welcome')}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormInput control={control} name="email" label={t('email')} placeholder="0098865885" type="text" />
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
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t('submitting') : t('signIn')}
              </Button>
            </form>
          </div>
        </div>
        <div className="p-4" />
      </div>
    </>
  );
}
