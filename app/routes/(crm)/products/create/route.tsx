import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { productsApi } from '~/api/products';
import { ProductFormFields } from '~/components/products/ProductFormFields';
import { EntityFormPage } from '~/components/shared/EntityFormPage';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { useEntityForm } from '~/hooks/useEntityForm';
import { useForm } from '~/hooks/useForm';
import { createProductSchema, type CreateProductSchema } from '~/validations/product';

export default function CreateProductPage() {
  const { t } = useTranslation(['products', 'common', 'validation']);

  const { control, handleSubmit } = useForm<CreateProductSchema>({
    resolver: zodResolver(createProductSchema(t)),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      costPrice: '',
      quantity: 0,
      unit: 'PCS',
      lowStockThreshold: 0,
      categoryId: '',
      image: null,
    },
  });

  const { submit, isPending } = useEntityForm<CreateProductSchema, unknown>({
    entity: 'products',
    api: productsApi,
    toPayload: (data) => ({
      name: data.name,
      description: data.description,
      price: data.price,
      quantity: data.quantity,
      costPrice: data.costPrice,
      unit: data.unit,
      lowStockThreshold: data.lowStockThreshold,
      categoryId: data.categoryId || undefined,
      image: data.image,
    }),
    redirectTo: () => '/products',
  });

  return (
    <EntityFormPage
      formId="create-product-page-form"
      title={t('create')}
      breadcrumbs={[
        { label: t('navigation.dashboard'), link: '/' },
        { label: t('title'), link: '/products' },
        { label: t('create') },
      ]}
      cancelTo="/products"
      submitLabel={t('actions.create')}
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
      <ProductFormFields control={control} t={t} />
    </EntityFormPage>
  );
}
