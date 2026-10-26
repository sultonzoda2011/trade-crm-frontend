import type { TFunction } from 'i18next';
import { useMemo } from 'react';
import type { Control } from 'react-hook-form';
import { categoriesApi } from '~/api/categories';
import { FormGrid } from '~/components/shared/FormGrid';
import { FormCustomSelect } from '~/components/ui/form/FormCustomSelect';
import { FormInput } from '~/components/ui/form/FormInput';
import { FormTextarea } from '~/components/ui/form/FormTextarea';
import { getUnitOptions } from '~/config/enumOptions';
import { useAsyncSelectOptions } from '~/hooks/useAsyncSelectOptions';
import { queryKeys } from '~/lib/query-keys';
import type { CreateProductSchema, UpdateProductSchema } from '~/validations/product';

interface ProductFormFieldsProps {
  control: Control<CreateProductSchema> | Control<UpdateProductSchema>;
  t: TFunction;
  /** Current category from a loaded product (seeds the async select on edit). */
  currentCategory?: { id: string; name: string } | null;
}

/**
 * Общие поля формы товара (создание и редактирование).
 */
export function ProductFormFields({ control, t, currentCategory }: ProductFormFieldsProps) {
  const categorySeed = useMemo(
    () => (currentCategory ? [{ id: currentCategory.id, name: currentCategory.name }] : undefined),
    [currentCategory]
  );

  const categories = useAsyncSelectOptions({
    queryKey: queryKeys.options('categories', { scope: 'form', limit: 20 }),
    fetcher: async (search) =>
      ((await categoriesApi.getAll(1, 20, { search: search || undefined }))?.data?.data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
      })),
    getValue: (c) => c.id,
    getLabel: (c) => c.name,
    seed: categorySeed,
  });

  const unitOptions = useMemo(() => getUnitOptions(t), [t]);
  const typedControl = control as Control<CreateProductSchema>;

  return (
    <>
      <FormGrid>
        <FormInput
          control={typedControl}
          name="name"
          label={t('fields.name')}
          placeholder={t('fields.name')}
          required
        />
        <FormCustomSelect
          control={typedControl}
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
          control={typedControl}
          name="price"
          type="number"
          inputMode="decimal"
          label={t('fields.price')}
          placeholder={t('fields.price')}
          required
        />
        <FormInput
          control={typedControl}
          name="quantity"
          type="number"
          inputMode="decimal"
          label={t('fields.quantity')}
          placeholder={t('fields.quantity')}
          required
        />
      </FormGrid>
      <FormGrid>
        <FormCustomSelect control={typedControl} name="unit" label={t('fields.unit')} options={unitOptions} />
        <FormInput
          control={typedControl}
          name="lowStockThreshold"
          type="number"
          inputMode="numeric"
          label={t('fields.lowStockThreshold')}
          placeholder={t('fields.lowStockThreshold')}
        />
      </FormGrid>
      <FormTextarea
        control={typedControl}
        name="description"
        label={t('fields.description')}
        placeholder={t('fields.description')}
        required
      />
    </>
  );
}
