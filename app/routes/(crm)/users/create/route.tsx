import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usersApi } from '~/api/users';
import { EntityFormPage } from '~/components/shared/EntityFormPage';
import { FormGrid } from '~/components/shared/FormGrid';
import { FormCustomSelect } from '~/components/ui/form/FormCustomSelect';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { getRoleOptions } from '~/config/enumOptions';
import { useEntityForm } from '~/hooks/useEntityForm';
import { useForm } from '~/hooks/useForm';
import { createUserSchema, type CreateUserSchema } from '~/validations/user';

export default function CreateUserPage() {
  const { t } = useTranslation(['users', 'common', 'validation']);
  const [showPassword, setShowPassword] = useState(false);

  const roleOptions = getRoleOptions(t);

  const { control, handleSubmit } = useForm<CreateUserSchema>({
    resolver: zodResolver(createUserSchema(t)),
    defaultValues: { name: '', email: '', password: '', role: '', image: null },
  });

  const { submit, isPending } = useEntityForm<CreateUserSchema, unknown>({
    entity: 'users',
    api: usersApi,
    toPayload: (data) => ({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      image: data.image,
    }),
    redirectTo: () => '/users',
  });

  return (
    <EntityFormPage
      formId="create-user-page-form"
      title={t('create')}
      breadcrumbs={[
        { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
        { label: t('title'), link: '/users' },
        { label: t('create') },
      ]}
      cancelTo="/users"
      submitLabel={t('actions.create', { ns: 'common' })}
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
          type={showPassword ? 'text' : 'password'}
          endIcon={
            showPassword ? (
              <EyeOff className="size-4 cursor-pointer bg-transparent" onClick={() => setShowPassword(!showPassword)} />
            ) : (
              <Eye className="size-4 cursor-pointer" onClick={() => setShowPassword(!showPassword)} />
            )
          }
          label={t('fields.password')}
          placeholder="••••••••"
          required
        />
      </FormGrid>
    </EntityFormPage>
  );
}
