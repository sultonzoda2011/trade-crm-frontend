import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { productsApi } from '~/api/products';
import { Modal } from '~/components/shared/Modal';
import { Button } from '~/components/ui/button';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { FormTextarea } from '~/components/ui/form/FormTextarea';
import { useForm } from '~/hooks/useForm';
import { appendToFormData } from '~/lib/form-data';
import { useProductsModals } from '~/routes/(crm)/products/store';
import { updateProductSchema, type UpdateProductSchema } from '~/validations/product';

export function EditProductModal() {
  const { t } = useTranslation(['products', 'common', 'validation']);
  const queryClient = useQueryClient();
  const editModal = useProductsModals((s) => s.edit);

  const { control, handleSubmit, reset } = useForm<UpdateProductSchema>({
    resolver: zodResolver(updateProductSchema(t)),
  });

  useEffect(() => {
    if (!editModal.data) return;
    reset({
      name: editModal.data.name,
      description: editModal.data.description,
      price: editModal.data.price,
      quantity: editModal.data.quantity,
      image: editModal.data.image,
    });
  }, [editModal.data, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: UpdateProductSchema) => {
      const payload: Record<string, unknown> = {
        name: data.name,
        description: data.description,
        price: data.price,
        quantity: data.quantity,
      };
      if (data.image instanceof File) {
        payload.image = data.image;
      }
      return productsApi.update({ formData: appendToFormData(payload), id: editModal.data!.id });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('updateSuccess'));
      editModal.close();
    },
    onError: () => {
      toast.error(t('updateError'));
    },
  });

  function onSubmit(data: UpdateProductSchema) {
    mutate(data);
  }

  return (
    <Modal
      open={editModal.isOpen}
      onClose={editModal.close}
      title={t('actions.edit')}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={editModal.close}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" form="edit-product-form" disabled={isPending}>
            {t('actions.save')}
          </Button>
        </div>
      }>
      <form id="edit-product-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <FormFileInput
            control={control}
            name="image"
            label={t('fields.image')}
            accept="image/*"
            aspectRatio="square"
            size="compact"
          />
          <div className="space-y-4">
            <FormInput control={control} name="name" label={t('fields.name')} placeholder={t('fields.name')} required />

            <FormInput
              control={control}
              name="price"
              type="number"
              label={t('fields.price')}
              placeholder={t('fields.price')}
              required
            />
            <FormInput
              control={control}
              name="quantity"
              type="number"
              label={t('fields.quantity')}
              placeholder={t('fields.quantity')}
              required
            />
          </div>
        </div>
        <FormTextarea
          control={control}
          name="description"
          label={t('fields.description')}
          placeholder={t('fields.description')}
          required
        />
      </form>
    </Modal>
  );
}
