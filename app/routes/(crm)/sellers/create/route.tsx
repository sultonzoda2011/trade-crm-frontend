import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { sellersApi } from '~/api/sellers';
import { EntityFormPage } from '~/components/shared/EntityFormPage';
import { FormGrid } from '~/components/shared/FormGrid';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { useEntityForm } from '~/hooks/useEntityForm';
import { useForm } from '~/hooks/useForm';
import { createSellerSchema, type CreateSellerSchema } from '~/validations/seller';

export default function CreateSellerPage() {
  const { t } = useTranslation(['sellers', 'common', 'validation']);

  const { control, handleSubmit } = useForm<CreateSellerSchema>({
    resolver: zodResolver(createSellerSchema(t)),
    defaultValues: { name: '', email: '', password: '', image: null },
  });

  const { submit, isPending } = useEntityForm<CreateSellerSchema, unknown>({
    entity: 'sellers',
    api: sellersApi,
    toPayload: (data) => ({ name: data.name, email: data.email, password: data.password, image: data.image }),
    redirectTo: () => '/sellers',
  });

  return (
    <EntityFormPage
      formId="create-seller-page-form"
      title={t('create')}
      breadcrumbs={[
        { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
        { label: t('title'), link: '/sellers' },
        { label: t('create') },
      ]}
      cancelTo="/sellers"
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
      <FormInput
        control={control}
        name="name"
        label={t('fields.fullName')}
        placeholder={t('fields.fullName')}
        required
      />
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
          placeholder="••••••••"
          required
        />
      </FormGrid>
    </EntityFormPage>
  );
}
