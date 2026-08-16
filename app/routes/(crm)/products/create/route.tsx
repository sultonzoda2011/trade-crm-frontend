import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { categoriesApi } from '~/api/categories';
import { productsApi } from '~/api/products';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { FormCustomSelect } from '~/components/ui/form/FormCustomSelect';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { FormTextarea } from '~/components/ui/form/FormTextarea';
import { Panel } from '~/components/layout/Panel';
import { FormGrid } from '~/components/shared/FormGrid';
import { useForm } from '~/hooks/useForm';
import { appendToFormData } from '~/lib/form-data';
import { createProductSchema, type CreateProductSchema } from '~/validations/product';

const UNIT_VALUES = ['PCS', 'KG', 'L', 'M', 'BOX'] as const;

export default function CreateProductPage() {
  const { t } = useTranslation(['products', 'common', 'validation']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: categoriesRes } = useQuery({
    queryKey: ['categories', 'list'],
    queryFn: () => categoriesApi.getAll(1, 100),
  });

  const categoryOptions = useMemo(
    () => (categoriesRes?.data?.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    [categoriesRes]
  );

  const unitOptions = useMemo(() => UNIT_VALUES.map((u) => ({ value: u, label: t(`unit.${u}`) })), [t]);

  const { control, handleSubmit } = useForm<CreateProductSchema>({
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
      };
      if (data.image instanceof File) {
        payload.image = data.image;
      }
      return productsApi.create(appendToFormData(payload));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate('/products');
    },
    onError: () => {},
  });

  function onSubmit(data: CreateProductSchema) {
    mutate(data);
  }

  return (
    <div className="flex flex-1 flex-col space-y-6 pb-8">
      <BreadCrumbs
        items={[
          { label: t('navigation.dashboard'), link: '/' },
          { label: t('title'), link: '/products' },
          { label: t('create') },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t('create')}</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/products')}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" form="create-product-page-form" disabled={isPending}>
            {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            {t('actions.create')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[3.5fr_6.5fr]">
        <Panel className="p-4">
          <FormFileInput
            control={control}
            name="image"
            label={t('common:fields.image')}
            accept="image/*"
            variant="dropzone"
            aspectRatio="square"
          />
        </Panel>

        <Panel className="p-6">
          <form id="create-product-page-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormGrid>
              <FormInput
                control={control}
                name="name"
                label={t('fields.name')}
                placeholder={t('fields.name')}
                required
              />
              <FormCustomSelect
                control={control}
                name="categoryId"
                label={t('fields.category')}
                placeholder={t('fields.category')}
                options={categoryOptions}
                isClearable
              />
            </FormGrid>
            <FormGrid>
              <FormInput
                control={control}
                name="price"
                type="number"
                inputMode="decimal"
                label={t('fields.price')}
                placeholder={t('fields.price')}
                required
              />
              <FormInput
                control={control}
                name="quantity"
                type="number"
                inputMode="decimal"
                label={t('fields.quantity')}
                placeholder={t('fields.quantity')}
                required
              />
            </FormGrid>
            <FormGrid>
              <FormCustomSelect control={control} name="unit" label={t('fields.unit')} options={unitOptions} />
              <FormInput
                control={control}
                name="lowStockThreshold"
                type="number"
                inputMode="numeric"
                label={t('fields.lowStockThreshold')}
                placeholder={t('fields.lowStockThreshold')}
              />
            </FormGrid>
            <FormTextarea
              control={control}
              name="description"
              label={t('fields.description')}
              placeholder={t('fields.description')}
              required
            />
          </form>
        </Panel>
      </div>
    </div>
  );
}
