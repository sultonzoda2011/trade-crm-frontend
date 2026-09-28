import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { categoriesApi } from '~/api/categories';
import { EntityFormPage } from '~/components/shared/EntityFormPage';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { FormTextarea } from '~/components/ui/form/FormTextarea';
import { useEntityForm } from '~/hooks/useEntityForm';
import { useForm } from '~/hooks/useForm';
import type { CategoryDetail } from '~/types/products';
import { updateCategorySchema, type UpdateCategorySchema } from '~/validations/category';

export default function EditCategoryPage() {
  const { t } = useTranslation(['categories', 'common', 'validation']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { control, handleSubmit, reset } = useForm<UpdateCategorySchema>({
    resolver: zodResolver(updateCategorySchema(t)),
  });

  const {
    detail: category,
    isLoading,
    submit,
    isPending,
  } = useEntityForm<UpdateCategorySchema, CategoryDetail>({
    entity: 'categories',
    id,
    fetcher: (categoryId) => categoriesApi.getById(categoryId),
    api: categoriesApi,
    toForm: (loaded) => ({
      name: loaded.name,
      description: loaded.description ?? '',
      image: loaded.image,
    }),
    toPayload: (data) => ({ name: data.name, description: data.description, image: data.image }),
    reset,
    redirectTo: (categoryId) => `/categories/${categoryId}`,
  });

  if (isLoading) return <ByIdSkeleton />;

  if (!category) {
    return (
      <NotFoundBlock
        label={t('notFound')}
        onBack={() => navigate('/categories')}
        backLabel={t('actions.back', { ns: 'common' })}
      />
    );
  }

  return (
    <EntityFormPage
      formId="edit-category-page-form"
      title={t('actions.edit', { ns: 'common' })}
      breadcrumbs={[
        { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
        { label: t('title'), link: '/categories' },
        { label: category.name, link: `/categories/${id}` },
        { label: t('actions.edit', { ns: 'common' }) },
      ]}
      cancelTo={`/categories/${id}`}
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
      <FormInput control={control} name="name" label={t('fields.name')} placeholder={t('fields.name')} required />
      <FormTextarea
        control={control}
        name="description"
        label={t('fields.description')}
        placeholder={t('fields.description')}
      />
    </EntityFormPage>
  );
}
