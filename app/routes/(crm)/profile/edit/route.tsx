import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { profileApi } from '~/api/profile';
import { AvatarField } from '~/components/profile/AvatarField';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { EntityFormPage } from '~/components/shared/EntityFormPage';
import { FormGrid } from '~/components/shared/FormGrid';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import { FormInput } from '~/components/ui/form/FormInput';
import { useForm } from '~/hooks/useForm';
import { parseApiError } from '~/lib/api-error';
import { appendToFormData } from '~/lib/form-data';
import { queryKeys } from '~/lib/query-keys';
import { updateProfileSchema, type UpdateProfileSchema } from '~/validations/profile';

export default function EditProfilePage() {
  const { t } = useTranslation(['profile', 'common', 'validation']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: queryKeys.me(),
    queryFn: () => profileApi.getProfile(),
  });
  const profile = response?.data;

  const schema = useMemo(() => updateProfileSchema(t, profile?.email ?? ''), [t, profile?.email]);
  const { control, handleSubmit, reset, setError, watch } = useForm<UpdateProfileSchema>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', currentPassword: '', image: null },
  });

  useEffect(() => {
    if (!profile) return;
    reset({
      name: profile.name,
      email: profile.email,
      phone: profile.phone ?? '',
      currentPassword: '',
      image: profile.image,
    });
  }, [profile, reset]);

  const email = watch('email');
  const emailChanged =
    !!profile && (email ?? '').trim().toLowerCase() !== profile.email.trim().toLowerCase();

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: UpdateProfileSchema) => {
      const body: Record<string, unknown> = {
        name: data.name.trim(),
        email: data.email.trim(),
        // Пустая строка — «очистить телефон», поэтому уходит всегда, а не пропускается.
        phone: data.phone.trim(),
      };
      if (emailChanged) body.currentPassword = data.currentPassword;
      if (data.image instanceof File) body.image = data.image;

      await profileApi.updateProfile(appendToFormData(body));
      // Фото убрали (а нового не выбрали) — отдельный запрос, у PATCH нет «стереть».
      if (data.image === null && profile?.image) await profileApi.removeImage();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profileAll() });
      toast.success(t('updateSuccess'));
      navigate('/profile');
    },
    onError: (error) => {
      const info = parseApiError(error);
      if (info.isOffline || info.isNetwork) return void toast.error(t('needInternet'));
      switch (info.code) {
        case 'EMAIL_IN_USE':
          return setError('email', { message: t('errors.emailInUse') });
        case 'CURRENT_PASSWORD_INCORRECT':
          return setError('currentPassword', { message: t('errors.currentPasswordIncorrect') });
        case 'CURRENT_PASSWORD_REQUIRED':
          return setError('currentPassword', { message: t('validation:currentPasswordForEmail') });
        default:
          toast.error(t('updateError'));
      }
    },
  });

  if (isLoading) return <ByIdSkeleton />;

  if (!profile) {
    return (
      <NotFoundBlock
        label={t('loadError')}
        onBack={() => navigate('/profile')}
        backLabel={t('actions.back', { ns: 'common' })}
      />
    );
  }

  return (
    <EntityFormPage
      formId="edit-profile-page-form"
      title={t('editTitle')}
      breadcrumbs={[
        { label: t('navigation.dashboard', { ns: 'common' }), link: '/dashboard' },
        { label: t('title'), link: '/profile' },
        { label: t('editTitle') },
      ]}
      cancelTo="/profile"
      submitLabel={t('actions.save', { ns: 'common' })}
      isPending={isPending}
      onFormSubmit={handleSubmit((data) => mutate(data))}
      imageField={
        <Controller
          control={control}
          name="image"
          render={({ field }) => (
            <AvatarField name={watch('name')} value={field.value ?? null} onChange={field.onChange} />
          )}
        />
      }>
      <FormInput control={control} name="name" label={t('fields.name')} placeholder={t('fields.name')} required />
      <FormGrid>
        <FormInput
          control={control}
          name="email"
          type="email"
          inputMode="email"
          autoCapitalize="none"
          label={t('fields.email')}
          placeholder="example@mail.com"
          required
        />
        <FormInput
          control={control}
          name="phone"
          type="tel"
          inputMode="tel"
          label={t('fields.phone')}
          placeholder="+992 900 00 00 00"
        />
      </FormGrid>

      {emailChanged && (
        <div className="space-y-2">
          <FormInput
            control={control}
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            label={t('fields.currentPassword')}
            placeholder={t('fields.currentPassword')}
            required
          />
          <p className="text-muted-foreground px-1 text-sm">{t('emailChangeHint')}</p>
        </div>
      )}
    </EntityFormPage>
  );
}
