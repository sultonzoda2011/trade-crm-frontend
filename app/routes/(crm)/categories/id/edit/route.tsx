import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { categoriesApi } from '~/api/categories';
import { Panel } from '~/components/layout/Panel';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { FormTextarea } from '~/components/ui/form/FormTextarea';
import { useForm } from '~/hooks/useForm';
import { appendToFormData } from '~/lib/form-data';
import { updateCategorySchema, type UpdateCategorySchema } from '~/validations/category';

export default function EditCategoryPage() {
  const { t } = useTranslation(['categories', 'common', 'validation']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ['category', id],
    queryFn: () => categoriesApi.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const { control, handleSubmit, reset } = useForm<UpdateCategorySchema>({
    resolver: zodResolver(updateCategorySchema(t)),
  });

  const category = response?.data;

  useEffect(() => {
    if (!category) return;
    reset({ name: category.name, description: category.description ?? '', image: category.image });
  }, [category, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: UpdateCategorySchema) => {
      const payload: Record<string, unknown> = { name: data.name, description: data.description || undefined };
      if (data.image instanceof File) payload.image = data.image;
      return categoriesApi.update({ formData: appendToFormData(payload), id: id! });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      void queryClient.invalidateQueries({ queryKey: ['category', id] });
      navigate(`/categories/${id}`);
    },
    onError: () => {},
  });

  function onSubmit(data: UpdateCategorySchema) {
    mutate(data);
  }

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
    <div className="flex flex-1 flex-col space-y-6 pb-24 md:pb-8">
      <BreadCrumbs
        items={[
          { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
          { label: t('title'), link: '/categories' },
          { label: category.name, link: `/categories/${id}` },
          { label: t('actions.edit', { ns: 'common' }) },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t('actions.edit', { ns: 'common' })}</h1>
        <div className="hidden gap-3 md:flex">
          <Button variant="outline" onClick={() => navigate(`/categories/${id}`)}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" form="edit-category-page-form" disabled={isPending}>
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
          <form id="edit-category-page-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormInput control={control} name="name" label={t('fields.name')} placeholder={t('fields.name')} required />
            <FormTextarea
              control={control}
              name="description"
              label={t('fields.description')}
              placeholder={t('fields.description')}
            />
          </form>
        </Panel>
      </div>

      <div
        className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 backdrop-blur md:hidden"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <div className="flex gap-3">
          <Button variant="outline" className="h-9 flex-1" onClick={() => navigate(`/categories/${id}`)}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" form="edit-category-page-form" className="h-9 flex-1" disabled={isPending}>
            {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            {t('actions.save', { ns: 'common' })}
          </Button>
        </div>
      </div>
    </div>
  );
}
