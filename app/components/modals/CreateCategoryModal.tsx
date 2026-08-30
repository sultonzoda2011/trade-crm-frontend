import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { categoriesApi } from '~/api/categories';
import { Modal } from '~/components/shared/Modal';
import { RequiresOnlineBanner } from '~/components/shared/RequiresOnlineBanner';
import { Button } from '~/components/ui/button';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { FormTextarea } from '~/components/ui/form/FormTextarea';
import { useIsMobile } from '~/hooks/use-mobile';
import { useForm } from '~/hooks/useForm';
import { useOnlineStatus } from '~/hooks/useOnlineStatus';
import { appendToFormData } from '~/lib/form-data';
import { useCategoriesModals } from '~/routes/(crm)/categories/store';
import { createCategorySchema, type CreateCategorySchema } from '~/validations/category';

export function CreateCategoryModal() {
  const { t } = useTranslation(['categories', 'common', 'validation']);
  const queryClient = useQueryClient();
  const createModal = useCategoriesModals((s) => s.create);

  const { control, handleSubmit, reset } = useForm<CreateCategorySchema>({
    resolver: zodResolver(createCategorySchema(t)),
    defaultValues: { name: '', description: '', image: null },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateCategorySchema) => {
      const payload: Record<string, unknown> = {
        name: data.name,
        description: data.description || undefined,
      };
      if (data.image instanceof File) {
        payload.image = data.image;
      }
      return categoriesApi.create(appendToFormData(payload));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(t('categories:createSuccess'));
      createModal.close();
      reset();
    },
    onError: () => {
      toast.error(t('categories:createError'));
    },
  });

  function onSubmit(data: CreateCategorySchema) {
    mutate(data);
  }
  const isMobile = useIsMobile();
  const online = useOnlineStatus();

  return (
    <Modal
      open={createModal.isOpen}
      onClose={createModal.close}
      title={t('create')}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={createModal.close}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" form="create-category-form" disabled={isPending || !online}>
            {t('actions.create')}
          </Button>
        </div>
      }>
      <form id="create-category-form" onSubmit={handleSubmit(onSubmit)}>
        {!online && (
          <div className="mb-4">
            <RequiresOnlineBanner />
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <FormFileInput
            control={control}
            name="image"
            label={!isMobile ? t('common:fields.image') : undefined}
            accept="image/*"
            aspectRatio="square"
            size="compact"            className="m-auto"

          />
          <div className="space-y-4">
            <FormInput control={control} name="name" label={t('fields.name')} placeholder={t('fields.name')} required />
            <FormTextarea
              control={control}
              name="description"
              label={t('fields.description')}
              placeholder={t('fields.description')}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
