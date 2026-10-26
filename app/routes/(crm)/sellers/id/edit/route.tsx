import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { sellersApi } from '~/api/sellers';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { EntityFormPage } from '~/components/shared/EntityFormPage';
import { FormGrid } from '~/components/shared/FormGrid';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { useEntityForm } from '~/hooks/useEntityForm';
import { useForm } from '~/hooks/useForm';
import type { Seller } from '~/types/sellers';
import { updateSellerSchema, type UpdateSellerSchema } from '~/validations/seller';

export default function EditSellerPage() {
  const { t } = useTranslation(['sellers', 'common', 'validation']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { control, handleSubmit, reset } = useForm<UpdateSellerSchema>({
    resolver: zodResolver(updateSellerSchema(t)),
  });

  const {
    detail: seller,
    isLoading,
    submit,
    isPending,
  } = useEntityForm<UpdateSellerSchema, Seller>({
    entity: 'sellers',
    id,
    fetcher: (sellerId) => sellersApi.getById(sellerId),
    api: sellersApi,
    toForm: (loaded) => ({
      name: loaded.name,
      email: loaded.email,
      password: '',
      image: loaded.image,
    }),
    toPayload: (data) => ({
      name: data.name,
      email: data.email,
      password: data.password,
      image: data.image,
    }),
    reset,
    redirectTo: (sellerId) => `/sellers/${sellerId}`,
  });

  if (isLoading) return <ByIdSkeleton />;

  if (!seller) {
    return (
      <NotFoundBlock
        label={t('notFound')}
        onBack={() => navigate('/sellers')}
        backLabel={t('actions.back', { ns: 'common' })}
      />
    );
  }

  return (
    <EntityFormPage
      formId="edit-seller-page-form"
      title={t('actions.edit', { ns: 'common' })}
      breadcrumbs={[
        { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
        { label: t('title'), link: '/sellers' },
        { label: seller.name, link: `/sellers/${id}` },
        { label: t('actions.edit', { ns: 'common' }) },
      ]}
      cancelTo={`/sellers/${id}`}
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
          placeholder={t('fields.password')}
        />
      </FormGrid>
    </EntityFormPage>
  );
}
