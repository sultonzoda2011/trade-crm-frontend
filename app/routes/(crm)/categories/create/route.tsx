import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { categoriesApi } from '~/api/categories';
import { EntityFormPage } from '~/components/shared/EntityFormPage';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { FormTextarea } from '~/components/ui/form/FormTextarea';
import { useEntityForm } from '~/hooks/useEntityForm';
import { useForm } from '~/hooks/useForm';
import { queryKeys } from '~/lib/query-keys';
import { createCategorySchema, type CreateCategorySchema } from '~/validations/category';

export default function CreateCategoryPage() {
  const { t } = useTranslation(['categories', 'common', 'validation']);

  const [searchParams] = useSearchParams();
  // «Копия» на карточке категории: форма открывается с данными исходной.
  const copyFromId = searchParams.get('copyFrom');

  const { data: sourceResponse } = useQuery({
    queryKey: queryKeys.detail('categories', copyFromId),
    queryFn: () => categoriesApi.getById(copyFromId!),
    enabled: !!copyFromId,
    staleTime: 30_000,
  });
  const source = sourceResponse?.data;

  const { control, handleSubmit, reset } = useForm<CreateCategorySchema>({
    resolver: zodResolver(createCategorySchema(t)),
    defaultValues: { name: '', description: '', image: null },
  });

  // Фото не переносим: бэкенд принимает только загруженный файл, а не ссылку на готовое.
  useEffect(() => {
    if (!source) return;
    reset({ name: t('copyName', { name: source.name }), description: source.description ?? '', image: null });
  }, [source, reset, t]);

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
      hint={source ? t('copyHint', { name: source.name }) : undefined}
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
