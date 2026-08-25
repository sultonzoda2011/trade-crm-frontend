import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { categoriesApi } from '~/api/categories';
import { Modal } from '~/components/shared/Modal';
import { Button } from '~/components/ui/button';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { FormTextarea } from '~/components/ui/form/FormTextarea';
import { useIsMobile } from '~/hooks/use-mobile';
import { useForm } from '~/hooks/useForm';
import { appendToFormData } from '~/lib/form-data';
import { useCategoriesModals } from '~/routes/(crm)/categories/store';
import { updateCategorySchema, type UpdateCategorySchema } from '~/validations/category';

export function EditCategoryModal() {
  const { t } = useTranslation(['categories', 'common', 'validation']);
  const queryClient = useQueryClient();
  const editModal = useCategoriesModals((s) => s.edit);

  const { control, handleSubmit, reset } = useForm<UpdateCategorySchema>({
    resolver: zodResolver(updateCategorySchema(t)),
  });

  useEffect(() => {
    if (!editModal.data) return;
    reset({ name: editModal.data.name, description: editModal.data.description ?? '', image: editModal.data.image });
  }, [editModal.data, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: UpdateCategorySchema) => {
      const payload: Record<string, unknown> = {
        name: data.name,
        description: data.description || undefined,
      };
      if (data.image instanceof File) {
        payload.image = data.image;
      }
      return categoriesApi.update({ formData: appendToFormData(payload), id: editModal.data!.id });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(t('updateSuccess'));
      editModal.close();
    },
    onError: () => {
      toast.error(t('updateError'));
    },
  });

  function onSubmit(data: UpdateCategorySchema) {
    mutate(data);
  }
  const isMobile = useIsMobile();

  return (
    <Modal
      open={editModal.isOpen}
      onClose={editModal.close}
      title={t('edit')}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={editModal.close}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" form="edit-category-form" disabled={isPending}>
            {t('actions.save')}
          </Button>
        </div>
      }>
      <form id="edit-category-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <FormFileInput
            control={control}
            name="image"
            label={!isMobile ? t('common:fields.image') : undefined}
            accept="image/*"
            aspectRatio="square"
            size="compact"
            className="m-auto sm:m-0"
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
