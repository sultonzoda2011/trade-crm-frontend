import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { productsApi } from '~/api/products';
import { StockSummary } from '~/components/products/StockSummary';
import { FilterChip, FilterChipGroup } from '~/components/shared/FilterChips';
import { Modal } from '~/components/shared/Modal';
import { ModalFooterActions } from '~/components/shared/ModalFooterActions';
import { FormInput } from '~/components/ui/form/FormInput';
import { FormTextarea } from '~/components/ui/form/FormTextarea';
import { useForm } from '~/hooks/useForm';
import { fmtNum } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';
import { useProductsModals } from '~/routes/(crm)/products/store';
import { WRITE_OFF_REASONS } from '~/types/products';
import { createWriteOffSchema, type WriteOffSchema } from '~/validations/product';

/**
 * Списание: порча, срок, потеря, «себе». Остаток уменьшается на сервере и пишется в историю
 * с причиной — раньше для этого приходилось «править» остаток и терять след.
 * Не офлайн-мутация (см. RestockProductModal): без сети — обычный тост, а не зависший запрос.
 */
export function WriteOffProductModal() {
  const { t } = useTranslation(['products', 'common', 'validation']);
  const queryClient = useQueryClient();
  const modal = useProductsModals((s) => s.writeOff);
  const product = modal.data;

  const { control, handleSubmit, reset, watch, setValue } = useForm<WriteOffSchema>({
    resolver: zodResolver(createWriteOffSchema(t)),
    defaultValues: {},
  });

  useEffect(() => {
    if (modal.isOpen) reset({});
  }, [modal.isOpen, product?.id, reset]);

  const removed = Number(watch('quantity')) || 0;
  const reason = watch('reason');
  const unit = product ? t(`unit.${product.unit}`) : '';
  const tooMany = !!product && removed > product.quantity;

  const { mutate, isPending } = useMutation({
    networkMode: 'always',
    mutationFn: (data: WriteOffSchema) =>
      productsApi.writeOff({
        id: product!.id,
        quantity: data.quantity,
        reason: data.reason,
        note: data.note?.trim() || undefined,
      }),
    onSuccess: (_result, data) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.entity('products') });
      toast.success(t('writeOff.success', { quantity: fmtNum(data.quantity), unit }));
      modal.close();
      reset({});
    },
  });

  function onSubmit(data: WriteOffSchema) {
    if (!product || isPending || data.quantity > product.quantity) return;
    mutate(data);
  }

  if (!product) return null;

  return (
    <Modal
      open={modal.isOpen}
      onClose={modal.close}
      title={t('writeOff.title', { name: product.name })}
      footer={
        <ModalFooterActions
          formId="write-off-product-form"
          onCancel={modal.close}
          submitLabel={`${t('writeOff.submit')}${removed > 0 && !tooMany ? ` · −${fmtNum(removed)} ${unit}` : ''}`}
          submitVariant="destructive"
          isLoading={isPending}
          disabled={removed <= 0 || tooMany || !reason}
        />
      }>
      <StockSummary
        currentLabel={t('writeOff.current')}
        afterLabel={t('writeOff.after')}
        current={product.quantity}
        after={removed > 0 && !tooMany ? product.quantity - removed : null}
        unit={unit}
        tone="destructive"
      />

      <form id="write-off-product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <FormInput
            control={control}
            name="quantity"
            type="number"
            inputMode="numeric"
            label={t('writeOff.quantity')}
            placeholder="0"
            autoFocus
            required
          />
          {tooMany && (
            <p role="alert" className="text-destructive px-1 text-sm">
              {t('writeOff.tooMany', { count: fmtNum(product.quantity), unit })}
            </p>
          )}
        </div>

        <FilterChipGroup label={t('writeOff.reason')}>
          {WRITE_OFF_REASONS.map((r) => (
            <FilterChip key={r} active={reason === r} onClick={() => setValue('reason', r, { shouldValidate: true })}>
              {t(`writeOffReason.${r}`)}
            </FilterChip>
          ))}
        </FilterChipGroup>

        <FormTextarea
          control={control}
          name="note"
          label={t('writeOff.note')}
          placeholder={t('writeOff.notePlaceholder')}
          rows={2}
          maxLength={200}
        />
        <p className="text-muted-foreground px-1 text-sm">{t('writeOff.hint')}</p>
      </form>
    </Modal>
  );
}
