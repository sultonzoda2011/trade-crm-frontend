import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { categoriesApi } from '~/api/categories';
import { EntityFormPage } from '~/components/shared/EntityFormPage';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { FormTextarea } from '~/components/ui/form/FormTextarea';
import { useEntityForm } from '~/hooks/useEntityForm';
import { useForm } from '~/hooks/useForm';
import { createCategorySchema, type CreateCategorySchema } from '~/validations/category';

export default function CreateCategoryPage() {
  const { t } = useTranslation(['categories', 'common', 'validation']);

  const { control, handleSubmit } = useForm<CreateCategorySchema>({
    resolver: zodResolver(createCategorySchema(t)),
    defaultValues: { name: '', description: '', image: null },
  });

  const { submit, isPending } = useEntityForm<CreateCategorySchema, unknown>({
    entity: 'categories',
    api: categoriesApi,
    // An empty description is dropped rather than sent as `''` — `buildMultipart`
    // does what this page used to spell `data.description || undefined`.
    toPayload: (data) => ({ name: data.name, description: data.description, image: data.image }),
    redirectTo: () => '/categories',
  });

  return (
    <EntityFormPage
      formId="create-category-page-form"
      title={t('create')}
      breadcrumbs={[
        { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
        { label: t('title'), link: '/categories' },
        { label: t('create') },
      ]}
      cancelTo="/categories"
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
