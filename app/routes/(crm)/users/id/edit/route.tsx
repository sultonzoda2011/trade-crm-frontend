import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { usersApi } from '~/api/users';
import { Panel } from '~/components/layout/Panel';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { FormGrid } from '~/components/shared/FormGrid';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { FormCustomSelect } from '~/components/ui/form/FormCustomSelect';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { getRoleOptions } from '~/config/enumOptions';
import { useForm } from '~/hooks/useForm';
import { appendToFormData } from '~/lib/form-data';
import { updateUserSchema, type UpdateUserSchema } from '~/validations/user';

export default function EditUserPage() {
  const { t } = useTranslation(['users', 'common', 'validation']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const roleOptions = getRoleOptions(t);

  const { data: response, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const { control, handleSubmit, reset } = useForm<UpdateUserSchema>({
    resolver: zodResolver(updateUserSchema(t)),
  });

  const user = response?.data;

  useEffect(() => {
    if (!user) return;
    reset({ name: user.name, email: user.email, password: '', role: user.role, image: user.image });
  }, [user, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: UpdateUserSchema) => {
      const payload: Record<string, unknown> = { name: data.name, email: data.email, role: data.role };
      if (data.password) payload.password = data.password;
      if (data.image instanceof File) payload.image = data.image;
      return usersApi.update({ formData: appendToFormData(payload), id: id! });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      void queryClient.invalidateQueries({ queryKey: ['user', id] });
      navigate(`/users/${id}`);
    },
    onError: () => {},
  });

  function onSubmit(data: UpdateUserSchema) {
    mutate(data);
  }

  if (isLoading) return <ByIdSkeleton />;

  if (!user) {
    return (
      <NotFoundBlock
        label={t('notFound')}
        onBack={() => navigate('/users')}
        backLabel={t('actions.back', { ns: 'common' })}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col space-y-6 pb-24 md:pb-8">
      <BreadCrumbs
        items={[
          { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
          { label: t('title'), link: '/users' },
          { label: user.name, link: `/users/${id}` },
          { label: t('actions.edit', { ns: 'common' }) },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t('actions.edit', { ns: 'common' })}</h1>
        <div className="hidden gap-3 md:flex">
          <Button variant="outline" onClick={() => navigate(`/users/${id}`)}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" form="edit-user-page-form" disabled={isPending}>
            {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            {t('actions.save', { ns: 'common' })}
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
          <form id="edit-user-page-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                type="password"
                label={t('fields.password')}
                placeholder={t('fields.password')}
              />
            </FormGrid>
          </form>
        </Panel>
      </div>

      <div
        className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 backdrop-blur md:hidden"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <div className="flex gap-3">
          <Button variant="outline" className="h-9 flex-1" onClick={() => navigate(`/users/${id}`)}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" form="edit-user-page-form" className="h-9 flex-1" disabled={isPending}>
            {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            {t('actions.save', { ns: 'common' })}
          </Button>
        </div>
      </div>
    </div>
  );
}
