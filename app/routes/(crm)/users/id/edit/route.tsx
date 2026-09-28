import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { usersApi } from '~/api/users';
import { EntityFormPage } from '~/components/shared/EntityFormPage';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { FormGrid } from '~/components/shared/FormGrid';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import { FormCustomSelect } from '~/components/ui/form/FormCustomSelect';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { getRoleOptions } from '~/config/enumOptions';
import { useEntityForm } from '~/hooks/useEntityForm';
import { useForm } from '~/hooks/useForm';
import type { User } from '~/types/users';
import { updateUserSchema, type UpdateUserSchema } from '~/validations/user';

export default function EditUserPage() {
  const { t } = useTranslation(['users', 'common', 'validation']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const roleOptions = getRoleOptions(t);

  const { control, handleSubmit, reset } = useForm<UpdateUserSchema>({
    resolver: zodResolver(updateUserSchema(t)),
  });

  const {
    detail: user,
    isLoading,
    submit,
    isPending,
  } = useEntityForm<UpdateUserSchema, User>({
    entity: 'users',
    id,
    fetcher: (userId) => usersApi.getById(userId),
    api: usersApi,
    toForm: (loaded) => ({
      name: loaded.name,
      email: loaded.email,
      password: '',
      role: loaded.role,
      image: loaded.image,
    }),
    // Empty `password` and a leftover avatar *string* are dropped by
    // `buildMultipart`, which is what the hand-rolled guards did.
    toPayload: (data) => ({
      name: data.name,
      email: data.email,
      role: data.role,
      password: data.password,
      image: data.image,
    }),
    reset,
    redirectTo: (userId) => `/users/${userId}`,
  });

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
    <EntityFormPage
      formId="edit-user-page-form"
      title={t('actions.edit', { ns: 'common' })}
      breadcrumbs={[
        { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
        { label: t('title'), link: '/users' },
        { label: user.name, link: `/users/${id}` },
        { label: t('actions.edit', { ns: 'common' }) },
      ]}
      cancelTo={`/users/${id}`}
      submitLabel={t('actions.save', { ns: 'common' })}
      isPending={isPending}
      onFormSubmit={handleSubmit(submit)}
      imageField={
        <FormFileInput
          control={control}
          name="image"
          label={t('common:fields.image')}
          accept="image/*"
          variant="dropzone"
          aspectRatio="square"
        />
      }>
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
    </EntityFormPage>
  );
}
