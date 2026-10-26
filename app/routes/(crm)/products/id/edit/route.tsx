import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { productsApi } from '~/api/products';
import { ProductFormFields } from '~/components/products/ProductFormFields';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { EntityFormPage } from '~/components/shared/EntityFormPage';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { useEntityForm } from '~/hooks/useEntityForm';
import { useForm } from '~/hooks/useForm';
import type { ProductDetail } from '~/types/products';
import { updateProductSchema, type UpdateProductSchema } from '~/validations/product';

export default function EditProductPage() {
  const { t } = useTranslation(['products', 'common', 'validation']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { control, handleSubmit, reset } = useForm<UpdateProductSchema>({
    resolver: zodResolver(updateProductSchema(t)),
  });

  const {
    detail: product,
    isLoading,
    submit,
    isPending,
  } = useEntityForm<UpdateProductSchema, ProductDetail>({
    entity: 'products',
    id,
    fetcher: (productId) => productsApi.getById(productId),
    api: productsApi,
    toForm: (loaded) => ({
      name: loaded.name,
      description: loaded.description,
      price: loaded.price,
      quantity: loaded.quantity,
      unit: loaded.unit,
      lowStockThreshold: loaded.lowStockThreshold,
      categoryId: loaded.categoryId ?? '',
      image: loaded.image,
    }),
    toPayload: (data) => ({
      name: data.name,
      description: data.description,
      price: data.price,
      quantity: data.quantity,
      unit: data.unit,
      lowStockThreshold: data.lowStockThreshold,
      categoryId: data.categoryId || undefined,
      image: data.image,
    }),
    reset,
    redirectTo: (productId) => `/products/${productId}`,
  });

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
    <EntityFormPage
      formId="edit-product-page-form"
      title={t('actions.edit')}
      breadcrumbs={[
        { label: t('navigation.dashboard'), link: '/' },
        { label: t('title'), link: '/products' },
        { label: product.name, link: `/products/${id}` },
        { label: t('actions.edit') },
      ]}
      cancelTo={`/products/${id}`}
      submitLabel={t('actions.save')}
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
      <ProductFormFields control={control} t={t} currentCategory={product.category ?? null} />
    </EntityFormPage>
  );
}
