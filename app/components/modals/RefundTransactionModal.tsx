import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { transactionsApi } from '~/api/transactions';
import { Modal } from '~/components/shared/Modal';
import { CustomInput } from '~/components/shared/CustomInput';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Radio, RadioGroup } from '~/components/ui/radio-group';
import { FormTextarea } from '~/components/ui/form/FormTextarea';
import { useForm } from '~/hooks/useForm';
import { fmtTJS } from '~/lib/format';
import { useTransactionsModals } from '~/routes/(crm)/transactions/store';
import type { RefundItemRequest } from '~/types/transactions';
import {
  refundTransactionSchema,
  type RefundableMap,
  type RefundTransactionInput,
} from '~/validations/transactions';

/**
 * Partial refund of a sale.
 *
 * A refund is part of the transaction domain, not a separate entity: the user
 * picks quantities on the *original sale lines*, so the backend can restore
 * exactly those units to stock and keep the link to the sale. The per-line
 * ceiling shown here is `refundableQuantity` from the detail endpoint — the
 * backend re-checks it, this only avoids a pointless failed request.
 */
export function RefundTransactionModal() {
  const { t } = useTranslation(['transactions', 'common', 'validation']);
  const queryClient = useQueryClient();
  const refundModal = useTransactionsModals((s) => s.refund);
  const transaction = refundModal.data;

  const refundableItems = useMemo(
    () => (transaction?.items ?? []).filter((item) => item.refundableQuantity > 0),
    [transaction]
  );

  const refundableMap: RefundableMap = useMemo(
    () => Object.fromEntries(refundableItems.map((item) => [item.id, item.refundableQuantity])),
    [refundableItems]
  );

  const { control, handleSubmit, reset, formState } = useForm<RefundTransactionInput>({
    resolver: zodResolver(refundTransactionSchema(t, refundableMap)),
    defaultValues: {
      mode: 'ALL',
      reason: '',
      items: refundableItems.map((item) => ({ itemId: item.id, quantity: '' })),
    },
  });

  const mode = useWatch({ control, name: 'mode' });
  const watchedItems = useWatch({ control, name: 'items' });

  // Unit price net of the line discount — the same basis the backend refunds on,
  // so the previewed total matches what actually gets returned.
  const refundTotal = useMemo(() => {
    if (mode === 'ALL') {
      return refundableItems.reduce(
        (sum, item) => sum + (item.totalPrice / item.quantity) * item.refundableQuantity,
        0
      );
    }
    return refundableItems.reduce((sum, item, index) => {
      const quantity = Number(watchedItems?.[index]?.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) return sum;
      const capped = Math.min(quantity, item.refundableQuantity);
      return sum + (item.totalPrice / item.quantity) * capped;
    }, 0);
  }, [mode, refundableItems, watchedItems]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: RefundTransactionInput) => {
      if (!transaction?.id) throw new Error('No transaction ID');

      // Omitting `items` means "everything still refundable" on the backend,
      // which keeps whole-transaction refunds a single well-defined case.
      const items: RefundItemRequest[] | undefined =
        data.mode === 'ALL'
          ? undefined
          : data.items
              .map((item) => ({ itemId: item.itemId, quantity: Number(item.quantity) }))
              .filter((item) => Number.isFinite(item.quantity) && item.quantity > 0);

      return transactionsApi.refund({
        id: transaction.id,
        request: { items, reason: data.reason?.trim() || undefined },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      if (transaction?.id) {
        void queryClient.invalidateQueries({ queryKey: ['transaction', transaction.id] });
      }
      toast.success(t('refundSuccess'));
      refundModal.close();
      reset();
    },
    onError: () => toast.error(t('refundError')),
  });

  if (!transaction) return null;

  const itemsError = formState.errors.items?.message ?? formState.errors.items?.root?.message;

  return (
    <Modal
      open={refundModal.isOpen}
      onClose={refundModal.close}
      title={t('refundModal.title')}
      className="sm:max-w-2xl"
      footer={
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <span className="text-muted-foreground">{t('refundModal.refundTotal')}: </span>
            <span className="text-destructive font-mono font-bold">{fmtTJS(refundTotal)}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 sm:flex-initial" onClick={refundModal.close}>
              {t('actions.cancel', { ns: 'common' })}
            </Button>
            <Button
              type="submit"
              form="refund-transaction-form"
              variant="destructive"
              className="flex-1 sm:flex-initial"
              disabled={isPending || refundableItems.length === 0}>
              {t('refundModal.submit')}
            </Button>
          </div>
        </div>
      }>
      {refundableItems.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">{t('refundModal.nothingRefundable')}</p>
      ) : (
        <form id="refund-transaction-form" onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
          <p className="text-muted-foreground text-sm">{t('refundModal.description')}</p>

          <Controller
            control={control}
            name="mode"
            render={({ field }) => (
              <div className="space-y-1.5">
                <Label>{t('refundModal.mode')}</Label>
                <RadioGroup
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                  className="gap-2">
                  <Radio value="ALL">{t('refundModal.modeAll')}</Radio>
                  <Radio value="PARTIAL">{t('refundModal.modePartial')}</Radio>
                </RadioGroup>
                {field.value === 'ALL' && (
                  <p className="text-muted-foreground text-xs">{t('refundModal.allHint')}</p>
                )}
              </div>
            )}
          />

          {/* Таблица не помещается по ширине на телефоне (5 колонок) — под md
              показываем те же данные карточками, таблица остаётся с md. */}
          <div className="space-y-2 md:hidden">
            {refundableItems.map((item, index) => (
              <div key={item.id} className="space-y-2 rounded-lg border p-3">
                <p className="text-sm font-medium">{item.productName || item.product?.name}</p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-muted-foreground">{t('refundModal.columns.sold')}</p>
                    <p className="font-mono font-semibold">{item.quantity}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('refundModal.columns.alreadyRefunded')}</p>
                    <p className="text-muted-foreground font-mono font-semibold">{item.refundedQuantity}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('refundModal.columns.refundable')}</p>
                    <p className="text-success font-mono font-semibold">{item.refundableQuantity}</p>
                  </div>
                </div>
                {mode === 'PARTIAL' && (
                  <Controller
                    control={control}
                    name={`items.${index}.quantity`}
                    render={({ field, fieldState }) => (
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">{t('refundModal.columns.toRefund')}</Label>
                        <CustomInput
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={item.refundableQuantity}
                          aria-invalid={!!fieldState.error}
                          aria-label={`${item.productName} — ${t('refundModal.columns.toRefund')}`}
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                        {fieldState.error && <p className="text-destructive text-2xs">{fieldState.error.message}</p>}
                      </div>
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground bg-sidebar border-b text-xs uppercase">
                <tr>
                  <th className="px-2.5 py-1.5">{t('refundModal.columns.product')}</th>
                  <th className="px-2.5 py-1.5 text-center">{t('refundModal.columns.sold')}</th>
                  <th className="px-2.5 py-1.5 text-center">{t('refundModal.columns.alreadyRefunded')}</th>
                  <th className="px-2.5 py-1.5 text-center">{t('refundModal.columns.refundable')}</th>
                  <th className="px-2.5 py-1.5 text-right">{t('refundModal.columns.toRefund')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {refundableItems.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-2.5 py-2 font-medium">{item.productName || item.product?.name}</td>
                    <td className="px-2.5 py-2 text-center font-mono">{item.quantity}</td>
                    <td className="text-muted-foreground px-2.5 py-2 text-center font-mono">
                      {item.refundedQuantity}
                    </td>
                    <td className="text-success px-2.5 py-2 text-center font-mono font-semibold">
                      {item.refundableQuantity}
                    </td>
                    <td className="px-2.5 py-2 text-right">
                      {mode === 'ALL' ? (
                        <span className="text-muted-foreground font-mono">{item.refundableQuantity}</span>
                      ) : (
                        <Controller
                          control={control}
                          name={`items.${index}.quantity`}
                          render={({ field, fieldState }) => (
                            <div className="flex flex-col items-end gap-1">
                              <CustomInput
                                type="number"
                                inputMode="numeric"
                                min={0}
                                max={item.refundableQuantity}
                                className="w-24 text-right"
                                aria-invalid={!!fieldState.error}
                                aria-label={`${item.productName} — ${t('refundModal.columns.toRefund')}`}
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(e.target.value === '' ? '' : Number(e.target.value))
                                }
                              />
                              {fieldState.error && (
                                <p className="text-destructive text-2xs">{fieldState.error.message}</p>
                              )}
                            </div>
                          )}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {itemsError && <p className="text-destructive text-sm">{itemsError}</p>}

          <FormTextarea
            control={control}
            name="reason"
            label={t('refundModal.reason')}
            placeholder={t('refundModal.reasonPlaceholder')}
          />
        </form>
      )}
    </Modal>
  );
}
