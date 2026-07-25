import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
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
import { createProductSchema, type CreateProductSchema } from '~/validations/product';

const UNIT_VALUES = ['PCS', 'KG', 'L', 'M', 'BOX'] as const;

export function CreateProductModal() {
  const { t } = useTranslation(['products', 'common', 'validation']);
  const queryClient = useQueryClient();
  const createModal = useProductsModals((s) => s.create);

  const { data: categoriesRes } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
    enabled: createModal.isOpen,
  });

  const categoryOptions = useMemo(
    () => (categoriesRes?.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    [categoriesRes],
  );

  const unitOptions = useMemo(
    () => UNIT_VALUES.map((u) => ({ value: u, label: t(`unit.${u}`) })),
    [t],
  );

  const { control, handleSubmit, reset } = useForm<CreateProductSchema>({
    resolver: zodResolver(createProductSchema(t)),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      quantity: 0,
      unit: 'PCS',
      lowStockThreshold: 0,
      categoryId: '',
      image: null,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateProductSchema) => {
      const payload: Record<string, unknown> = {
        name: data.name,
        description: data.description,
        price: data.price,
        quantity: data.quantity,
        unit: data.unit,
        lowStockThreshold: data.lowStockThreshold,
        categoryId: data.categoryId || undefined,
        image: data.image,
      };
      if (data.image instanceof File) {
        payload.image = data.image;
      }
      const formData = appendToFormData(payload);
      return productsApi.create(formData);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('createSuccess'));
      createModal.close();
      reset();
    },
    onError: () => {
      toast.error(t('createError'));
    },
  });

  function onSubmit(data: CreateProductSchema) {
    mutate(data);
  }

  return (
    <Modal
      open={createModal.isOpen}
      onClose={createModal.close}
      title={t('create')}
      className="max-w-xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={createModal.close}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" form="create-product-form" disabled={isPending}>
            {t('actions.create')}
          </Button>
        </div>
      }>
      <form id="create-product-form" onSubmit={handleSubmit(onSubmit)}>
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
