import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { usersApi } from '~/api/users';
import { Panel } from '~/components/layout/Panel';
import { FormGrid } from '~/components/shared/FormGrid';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { FormCustomSelect } from '~/components/ui/form/FormCustomSelect';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { getRoleOptions } from '~/config/enumOptions';
import { useForm } from '~/hooks/useForm';
import { appendToFormData } from '~/lib/form-data';
import { createUserSchema, type CreateUserSchema } from '~/validations/user';

export default function CreateUserPage() {
  const { t } = useTranslation(['users', 'common', 'validation']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const roleOptions = getRoleOptions(t);

  const { control, handleSubmit } = useForm<CreateUserSchema>({
    resolver: zodResolver(createUserSchema(t)),
    defaultValues: { name: '', email: '', password: '', role: '', image: null },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateUserSchema) => {
      const payload: Record<string, unknown> = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      };
      if (data.image instanceof File) payload.image = data.image;
      return usersApi.create(appendToFormData(payload));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
    onError: () => {},
  });

  function onSubmit(data: CreateUserSchema) {
    mutate(data);
  }

  return (
    <div className="flex flex-1 flex-col space-y-6 pb-24 md:pb-8">
      <BreadCrumbs
        items={[
          { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
          { label: t('title'), link: '/users' },
          { label: t('create') },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t('create')}</h1>
        <div className="hidden gap-3 md:flex">
          <Button variant="outline" onClick={() => navigate('/users')}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" form="create-user-page-form" disabled={isPending}>
            {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            {t('actions.create', { ns: 'common' })}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[3.5fr_6.5fr]">
        <Panel>
          <FormFileInput
            control={control}
            name="image"
            label={t('common:fields.image')}
            accept="image/*"
            variant="dropzone"
            aspectRatio="square"
          />
        </Panel>

        <Panel bodyClassName="p-6">
          <form id="create-user-page-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormGrid>
              <FormInput
                control={control}
                name="name"
                label={t('fields.fullName')}
                placeholder={t('fields.fullName')}
                required
              />
              <FormCustomSelect
                control={control}
                name="role"
                label={t('fields.role')}
                options={roleOptions}
                placeholder={t('fields.role')}
                required
              />
            </FormGrid>
            <FormGrid>
              <FormInput
                control={control}
                name="email"
                type="email"
                label={t('fields.email')}
                placeholder="example@mail.com"
                required
              />
              <FormInput
                control={control}
                name="password"
                type={showPassword ? 'text' : 'password'}
                endIcon={
                  showPassword ? (
                    <EyeOff
                      className="size-4 cursor-pointer bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    />
                  ) : (
                    <Eye className="size-4 cursor-pointer" onClick={() => setShowPassword(!showPassword)} />
                  )
                }
                label={t('fields.password')}
                placeholder="••••••••"
                required
              />
            </FormGrid>
          </form>
        </Panel>
      </div>

      <div
        className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 backdrop-blur md:hidden"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <div className="flex gap-3">
          <Button variant="outline" className="h-9 flex-1" onClick={() => navigate('/users')}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" form="create-user-page-form" className="h-9 flex-1" disabled={isPending}>
            {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            {t('actions.create', { ns: 'common' })}
          </Button>
        </div>
      </div>
    </div>
  );
}
