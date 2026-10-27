import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { debtorsApi } from '~/api/debtors';
import { Modal } from '~/components/shared/Modal';
import { ModalFooterActions } from '~/components/shared/ModalFooterActions';
import { FormInput } from '~/components/ui/form/FormInput';
import { FormTextarea } from '~/components/ui/form/FormTextarea';
import { useForm } from '~/hooks/useForm';
import { fmtNum, fmtTJS } from '~/lib/format';
import { createIdempotencyKey } from '~/lib/offline-mutations';
import { queryKeys } from '~/lib/query-keys';
import { cn } from '~/lib/utils';
import { showSuccess } from '~/store/useSuccessStore';
import type { Debtor } from '~/types/debtors';
import { debtorPaymentSchema, type DebtorPaymentSchema } from '~/validations/debtor';

interface PayDebtorModalProps {
  debtor: Pick<Debtor, 'id' | 'totalDebtAmount'>;
  open: boolean;
  onClose: () => void;
}

const FORM_ID = 'pay-debtor-form';

/**
 * «Человек принёс сумму»: вводим, сколько он отдал, а не выбираем долг. Бэкенд раскладывает
 * сумму по долгам от старых к новым (POST /debtors/:id/payments). Работает только онлайн —
 * офлайн страница должника открывает прежнее окно оплаты по одной транзакции.
 */
export function PayDebtorModal({ debtor, open, onClose }: PayDebtorModalProps) {
  const { t } = useTranslation(['debtors', 'transactions', 'common', 'validation']);
  const queryClient = useQueryClient();
  const total = debtor.totalDebtAmount;

  const schema = useMemo(() => debtorPaymentSchema(t, total), [t, total]);
  const { control, handleSubmit, reset, watch, setValue } = useForm<DebtorPaymentSchema>({
    resolver: zodResolver(schema),
    defaultValues: { amount: total, note: '' },
  });

  // Сумма долга могла измениться, пока окно было закрыто, — каждый раз открываем с актуальной.
  useEffect(() => {
    if (open) reset({ amount: total, note: '' });
  }, [open, total, reset]);

  const amount = Number(watch('amount')) || 0;

  const { mutate, isPending } = useMutation({
    mutationFn: (data: DebtorPaymentSchema) =>
      debtorsApi.pay(
        debtor.id,
        { amount: Math.round(data.amount * 100) / 100, note: data.note.trim() || undefined },
        createIdempotencyKey()
      ),
    onSuccess: (response, data) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.entity('debtors') });
      void queryClient.invalidateQueries({ queryKey: queryKeys.entity('transactions') });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      const left = response?.data?.remainingDebt ?? Math.max(total - data.amount, 0);
      showSuccess({
        title: t('payDebtor.success', { amount: fmtTJS(data.amount) }),
        description: left > 0 ? t('payDebtor.left', { amount: fmtTJS(left) }) : t('payDebtor.allPaid'),
        amount: data.amount,
      });
      onClose();
    },
  });

  const quickAmounts = [
    { label: t('payDebtor.full'), value: total },
    { label: t('payDebtor.half'), value: Math.round(total / 2) },
  ].filter((q) => q.value > 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('payDebtor.title')}
      footer={
        <ModalFooterActions
          formId={FORM_ID}
          onCancel={onClose}
          submitLabel={`${t('payDebtor.submit')} · ${fmtTJS(amount)}`}
          isLoading={isPending}
          disabled={amount <= 0}
        />
      }>
      <div className="bg-muted mb-4 flex items-center justify-between rounded-xl p-3 text-base">
        <span className="text-muted-foreground">{t('payDebtor.totalDebt')}:</span>
        <span className="text-warning font-mono font-bold">{fmtTJS(total)}</span>
      </div>

      <form id={FORM_ID} onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
        <div className="space-y-1.5">
          <FormInput
            control={control}
            name="amount"
            type="number"
            inputMode="decimal"
            label={t('payDebtor.amount')}
            placeholder={t('payDebtor.amount')}
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            required
          />
          <div className="flex flex-wrap gap-2 px-1">
            {quickAmounts.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => setValue('amount', q.value, { shouldValidate: true })}
                className={cn(
                  'h-10 rounded-[10px] px-3.5 text-sm font-semibold transition-opacity active:opacity-60',
                  amount === q.value ? 'bg-primary text-primary-foreground' : 'bg-primary/12 text-primary'
                )}>
                {q.label} · {fmtNum(q.value)}
              </button>
            ))}
          </div>
          <p className="text-muted-foreground px-1 text-sm">{t('payDebtor.oldestFirst')}</p>
        </div>
        <FormTextarea control={control} name="note" label={t('payDebtor.note')} placeholder={t('payDebtor.note')} />
      </form>
    </Modal>
  );
}
