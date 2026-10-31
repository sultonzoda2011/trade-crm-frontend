import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { productsApi } from '~/api/products';
import { StockSummary } from '~/components/products/StockSummary';
import { Modal } from '~/components/shared/Modal';
import { ModalFooterActions } from '~/components/shared/ModalFooterActions';
import { FormInput } from '~/components/ui/form/FormInput';
import { FormTextarea } from '~/components/ui/form/FormTextarea';
import { useForm } from '~/hooks/useForm';
import { fmtNum } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';
import { cn } from '~/lib/utils';
import { useProductsModals } from '~/routes/(crm)/products/store';
import { createAdjustSchema, type AdjustSchema } from '~/validations/product';

/** Ответ 409 `PRODUCT_STOCK_CHANGED`: пока считали, прошла продажа — показываем свежий остаток. */
function readCurrentQuantity(error: unknown): number | null {
  if (!isAxiosError(error) || error.response?.status !== 409) return null;
  const body = error.response.data as { code?: string; details?: { currentQuantity?: number } } | undefined;
  return body?.code === 'PRODUCT_STOCK_CHANGED' ? (body.details?.currentQuantity ?? null) : null;
}

/**
 * Пересчёт («на полке N»): тут остаток задаётся ИТОГОМ, а разница с учётным числом уходит в историю.
 * Единственное место, где вводят итог, а не прибавку — поэтому внизу показываем, на сколько изменится.
 */
export function AdjustStockModal() {
  const { t } = useTranslation(['products', 'common', 'validation']);
  const queryClient = useQueryClient();
  const modal = useProductsModals((s) => s.adjust);
  const product = modal.data;

  // Свежий остаток из 409 — перекрывает то, что мы видели при открытии окна.
  const [serverQuantity, setServerQuantity] = useState<number | null>(null);
  const current = serverQuantity ?? product?.quantity ?? 0;

  const { control, handleSubmit, reset, watch } = useForm<AdjustSchema>({
    resolver: zodResolver(createAdjustSchema(t)),
    defaultValues: {},
  });

  useEffect(() => {
    if (!modal.isOpen) return;
    setServerQuantity(null);
    reset({});
  }, [modal.isOpen, product?.id, reset]);

  const raw = watch('quantity') as number | '' | undefined;
  const counted = raw === '' || raw == null ? null : Number(raw);
  const diff = counted == null ? null : counted - current;
  const unit = product ? t(`unit.${product.unit}`) : '';

  const { mutate, isPending } = useMutation({
    networkMode: 'always',
    mutationFn: (data: AdjustSchema) =>
      productsApi.adjust({ id: product!.id, quantity: data.quantity, note: data.note?.trim() || undefined }),
    onSuccess: (_result, data) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.entity('products') });
      const d = data.quantity - current;
      toast.success(
        d === 0
          ? t('adjust.unchanged')
          : t('adjust.success', { diff: `${d > 0 ? '+' : '−'}${fmtNum(Math.abs(d))}`, unit })
      );
      modal.close();
      reset({});
    },
    onError: (error) => {
      const fresh = readCurrentQuantity(error);
      if (fresh == null) return;
      // Глобальный перехватчик уже показал тост с сообщением сервера; здесь — понятная подсказка в окне.
      setServerQuantity(fresh);
    },
  });

  function onSubmit(data: AdjustSchema) {
    if (!product || isPending) return;
    mutate(data);
  }

  if (!product) return null;

  return (
    <Modal
      open={modal.isOpen}
      onClose={modal.close}
      title={t('adjust.title', { name: product.name })}
      footer={
        <ModalFooterActions
          formId="adjust-stock-form"
          onCancel={modal.close}
          submitLabel={t('adjust.submit')}
          isLoading={isPending}
          disabled={counted == null}
        />
      }>
      <StockSummary
        currentLabel={t('adjust.current')}
        afterLabel={t('adjust.counted')}
        current={current}
        after={counted}
        unit={unit}
      />

      <form id="adjust-stock-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormInput
          control={control}
          name="quantity"
          type="number"
          inputMode="numeric"
          label={t('adjust.counted')}
          placeholder={String(current)}
          autoFocus
          required
        />

        {serverQuantity != null && (
          <p role="alert" className="bg-warning/12 text-warning rounded-xl px-3 py-2 text-sm">
            {t('adjust.changed', { count: fmtNum(serverQuantity), unit })}
          </p>
        )}

        {diff != null && (
          <p
            aria-live="polite"
            className={cn(
              'px-1 text-sm font-medium tabular-nums',
              diff > 0 && 'text-success',
              diff < 0 && 'text-destructive',
              diff === 0 && 'text-muted-foreground'
            )}>
            {diff === 0
              ? t('adjust.same')
              : `${t('adjust.difference')}: ${diff > 0 ? '+' : '−'}${fmtNum(Math.abs(diff))} ${unit}`}
          </p>
        )}

        <FormTextarea
          control={control}
          name="note"
          label={t('adjust.note')}
          placeholder={t('adjust.notePlaceholder')}
          rows={2}
          maxLength={200}
        />
        <p className="text-muted-foreground px-1 text-sm">{t('adjust.hint')}</p>
      </form>
    </Modal>
  );
}
