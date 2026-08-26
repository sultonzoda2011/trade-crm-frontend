import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { categoriesApi } from '~/api/categories';
import { productsApi } from '~/api/products';
import { Panel } from '~/components/layout/Panel';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import { FormGrid } from '~/components/shared/FormGrid';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { FormCustomSelect } from '~/components/ui/form/FormCustomSelect';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { FormTextarea } from '~/components/ui/form/FormTextarea';
import { useAsyncSelectOptions } from '~/hooks/useAsyncSelectOptions';
import { useForm } from '~/hooks/useForm';
import { appendToFormData } from '~/lib/form-data';
import { updateProductSchema, type UpdateProductSchema } from '~/validations/product';

const UNIT_VALUES = ['PCS', 'KG', 'L', 'M', 'BOX'] as const;

export default function EditProductPage() {
  const { t } = useTranslation(['products', 'common', 'validation']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  // Seed with the product's current category so the select shows its label even when that
  // category isn't on the first page of server results.
  const currentCategory = response?.data?.category ?? null;
  const categorySeed = useMemo(
    () => (currentCategory ? [{ id: currentCategory.id, name: currentCategory.name }] : undefined),
    [currentCategory]
  );

  const categories = useAsyncSelectOptions({
    queryKey: ['categories', 'list'],
    fetcher: async (search) =>
      ((await categoriesApi.getAll(1, 20, { search: search || undefined }))?.data?.data ?? []).map((c) => ({ id: c.id, name: c.name })),
    getValue: (c) => c.id,
    getLabel: (c) => c.name,
    seed: categorySeed,
  });

  const unitOptions = useMemo(() => UNIT_VALUES.map((u) => ({ value: u, label: t(`unit.${u}`) })), [t]);

  const { control, handleSubmit, reset } = useForm<UpdateProductSchema>({
    resolver: zodResolver(updateProductSchema(t)),
  });

  const product = response?.data;

  useEffect(() => {
    if (!product) return;
    reset({
      name: product.name,
      description: product.description,
      price: product.price,
      quantity: product.quantity,
      unit: product.unit,
      lowStockThreshold: product.lowStockThreshold,
      categoryId: product.categoryId ?? '',
      image: product.image,
    });
  }, [product, reset]);

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
      return productsApi.update({ formData: appendToFormData(payload), id: id! });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['product', id] });
      navigate(`/products/${id}`);
    },
    onError: () => {},
  });

  function onSubmit(data: UpdateProductSchema) {
    mutate(data);
  }

  if (isLoading) return <ByIdSkeleton />;

  if (!product) {
    return (
      <NotFoundBlock
        label={t('notFound')}
        onBack={() => navigate('/products')}
        backLabel={t('actions.back', { ns: 'common' })}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col space-y-6 pb-24 md:pb-8">
      <BreadCrumbs
        items={[
          { label: t('navigation.dashboard'), link: '/' },
          { label: t('title'), link: '/products' },
          { label: product.name, link: `/products/${id}` },
          { label: t('actions.edit') },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t('actions.edit')}</h1>
        {/* На телефоне действия продублированы в sticky-панели снизу, здесь только для md+. */}
        <div className="hidden gap-3 md:flex">
          <Button variant="outline" onClick={() => navigate(`/products/${id}`)}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" form="edit-product-page-form" disabled={isPending}>
            {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            {t('actions.save')}
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
          <form id="edit-product-page-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                options={categories.options}
                onSearch={categories.onSearch}
                loading={categories.loading}
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

      <div
        className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 backdrop-blur md:hidden"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => navigate(`/products/${id}`)}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" form="edit-product-page-form" className="flex-1" disabled={isPending}>
            {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            {t('actions.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
