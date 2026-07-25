import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { categoriesApi } from '~/api/categories';
import { productsApi } from '~/api/products';
import { Modal } from '~/components/shared/Modal';
import { Button } from '~/components/ui/button';
import { FormCustomSelect } from '~/components/ui/form/FormCustomSelect';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { FormTextarea } from '~/components/ui/form/FormTextarea';
import { useForm } from '~/hooks/useForm';
import { appendToFormData } from '~/lib/form-data';
import { useProductsModals } from '~/routes/(crm)/products/store';
import { updateProductSchema, type UpdateProductSchema } from '~/validations/product';

const UNIT_VALUES = ['PCS', 'KG', 'L', 'M', 'BOX'] as const;

export function EditProductModal() {
  const { t } = useTranslation(['products', 'common', 'validation']);
  const queryClient = useQueryClient();
  const editModal = useProductsModals((s) => s.edit);

  const { data: categoriesRes } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
    enabled: editModal.isOpen,
  });

  const categoryOptions = useMemo(
    () => (categoriesRes?.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    [categoriesRes],
  );

  const unitOptions = useMemo(() => UNIT_VALUES.map((u) => ({ value: u, label: t(`unit.${u}`) })), [t]);

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
      unit: editModal.data.unit,
      lowStockThreshold: editModal.data.lowStockThreshold,
      categoryId: editModal.data.categoryId ?? '',
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
        unit: data.unit,
        lowStockThreshold: data.lowStockThreshold,
        categoryId: data.categoryId || undefined,
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
      className="max-w-xl"
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

            <div className="grid grid-cols-2 gap-3">
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
            <div className="grid grid-cols-2 gap-3">
              <FormCustomSelect control={control} name="unit" label={t('fields.unit')} options={unitOptions} />
              <FormInput
                control={control}
                name="lowStockThreshold"
                type="number"
                label={t('fields.lowStockThreshold')}
                placeholder={t('fields.lowStockThreshold')}
              />
            </div>
            <FormCustomSelect
              control={control}
              name="categoryId"
              label={t('fields.category')}
              placeholder={t('fields.category')}
              options={categoryOptions}
              isClearable
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
