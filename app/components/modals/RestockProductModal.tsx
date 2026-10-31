import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { productsApi } from '~/api/products';
import { Modal } from '~/components/shared/Modal';
import { ModalFooterActions } from '~/components/shared/ModalFooterActions';
import { StockSummary } from '~/components/products/StockSummary';
import { FormInput } from '~/components/ui/form/FormInput';
import { FormTextarea } from '~/components/ui/form/FormTextarea';
import { useForm } from '~/hooks/useForm';
import { fmtNum } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';
import { cn } from '~/lib/utils';
import { useProductsModals } from '~/routes/(crm)/products/store';
import { createRestockSchema, type RestockSchema } from '~/validations/product';

/** Частые поставки — одно касание вместо набора числа. */
const QUICK_AMOUNTS = [10, 50, 100];

/**
 * Пополнение остатка: «+N» к тому, что на складе, а не новый итог.
 *
 * Отдельное окно, а не форма правки: форма записывает число, которое человек
 * видел на экране, и затирает продажи, прошедшие за это время. Здесь на сервер
 * уходит только прибавка, а сложение делает БД.
 *
 * Не офлайн-мутация (в очередь попадают только четыре, см. AGENTS.md): без сети
 * запрос падает сразу с обычным тостом «нет соединения», а не висит на паузе.
 * Ошибки сервера (в т.ч. «лимит остатка») показывает глобальный перехватчик axios.
 */
export function RestockProductModal() {
  const { t } = useTranslation(['products', 'common', 'validation']);
  const queryClient = useQueryClient();
  const restockModal = useProductsModals((s) => s.restock);
  const product = restockModal.data;

  const { control, handleSubmit, reset, watch, setValue } = useForm<RestockSchema>({
    resolver: zodResolver(createRestockSchema(t)),
    defaultValues: {},
  });

  // Окно открыли для другого товара — поле пустое, а не с числом прошлого пополнения.
  useEffect(() => {
    if (restockModal.isOpen) reset({});
  }, [restockModal.isOpen, product?.id, reset]);

  const added = Number(watch('quantity')) || 0;
  const unit = product ? t(`unit.${product.unit}`) : '';

  const { mutate, isPending } = useMutation({
    networkMode: 'always',
    mutationFn: (data: RestockSchema) =>
      productsApi.restock({ id: product!.id, quantity: data.quantity, note: data.note?.trim() || undefined }),
    onSuccess: (_result, data) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.entity('products') });
      toast.success(t('restock.success', { quantity: fmtNum(data.quantity), unit }));
      restockModal.close();
      reset({});
    },
  });

  function onSubmit(data: RestockSchema) {
    // Повторное нажатие, пока запрос в пути, не должно прибавить остаток дважды.
    if (!product || isPending) return;
    mutate(data);
  }

  if (!product) return null;

  return (
    <Modal
      open={restockModal.isOpen}
      onClose={restockModal.close}
      title={t('restock.title', { name: product.name })}
      footer={
        <ModalFooterActions
          formId="restock-product-form"
          onCancel={restockModal.close}
          submitLabel={`${t('restock.submit')}${added > 0 ? ` · +${fmtNum(added)} ${unit}` : ''}`}
          isLoading={isPending}
          disabled={added <= 0}
        />
      }>
      <StockSummary
        currentLabel={t('restock.current')}
        afterLabel={t('restock.after')}
        current={product.quantity}
        after={added > 0 ? product.quantity + added : null}
        unit={unit}
        tone="success"
      />

      <form id="restock-product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <FormInput
            control={control}
            name="quantity"
            type="number"
            inputMode="numeric"
            label={t('restock.quantity')}
            placeholder="0"
            autoFocus
            required
          />
          <div className="flex flex-wrap gap-2 px-1">
            {QUICK_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setValue('quantity', amount, { shouldValidate: true })}
                className={cn(
                  'h-10 rounded-[10px] px-3.5 text-sm font-semibold transition-opacity active:opacity-60',
                  added === amount ? 'bg-primary text-primary-foreground' : 'bg-primary/12 text-primary'
                )}>
                +{fmtNum(amount)}
              </button>
            ))}
          </div>
        </div>
        <FormTextarea
          control={control}
          name="note"
          label={t('restock.note')}
          placeholder={t('restock.notePlaceholder')}
          rows={2}
          maxLength={200}
        />
        <p className="text-muted-foreground px-1 text-sm">{t('restock.hint')}</p>
      </form>
    </Modal>
  );
}
