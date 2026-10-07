import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { showSuccess } from '~/store/useSuccessStore';
import { transactionsApi } from '~/api/transactions';
import { Modal } from '~/components/shared/Modal';
import { TransactionProducts, getTransactionTitle } from '~/components/transactions/TransactionProducts';
import { Button } from '~/components/ui/button';
import { FormInput } from '~/components/ui/form/FormInput';
import { FormTextarea } from '~/components/ui/form/FormTextarea';
import { useForm } from '~/hooks/useForm';
import { fmtNum, fmtTJS } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';
import { cn } from '~/lib/utils';
import { useTransactionsModals } from '~/routes/(crm)/transactions/store';
import { createPaymentSchema, type CreatePaymentSchema } from '~/validations/transactions';

export function CreatePaymentModal() {
  const { t } = useTranslation(['transactions', 'common', 'validation']);
  const queryClient = useQueryClient();
  const payModal = useTransactionsModals((s) => s.pay);
  const transaction = payModal.data;

  const { control, handleSubmit, reset, watch, setValue } = useForm<CreatePaymentSchema>({
    resolver: zodResolver(createPaymentSchema(t)),
    defaultValues: {
      amount: transaction?.remainingAmount ?? 0,
      note: '',
    },
  });

  const amount = Number(watch('amount')) || 0;
  const remaining = transaction?.remainingAmount ?? 0;

  // Быстрые суммы: закрыть остаток целиком или половину — самый частый случай оплаты,
  // не заставляем каждый раз стирать "0" и набирать сумму вручную.
  const quickAmounts =
    remaining > 0
      ? [
          { label: t('payModal.full', { ns: 'transactions' }), value: remaining },
          { label: t('payModal.half', { ns: 'transactions' }), value: Math.round(remaining / 2) },
        ]
      : [];

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreatePaymentSchema) => {
      if (!transaction?.id) throw new Error('No transaction ID');
      return transactionsApi.pay({ request: data, id: transaction.id });
    },
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.entity('transactions') });
      // Оплата меняет долг должника — его список и карточка тоже устаревают.
      void queryClient.invalidateQueries({ queryKey: queryKeys.entity('debtors') });
      if (transaction?.id) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.full('transactions', transaction.id) });
      }
      showSuccess({ title: t('transactions:paySuccess'), amount: Number(variables.amount) });
      payModal.close();
      reset();
    },
    onError: () => {
      toast.error(t('transactions:payError'));
    },
  });

  function onSubmit(data: CreatePaymentSchema) {
    mutate(data);
  }

  if (!transaction) return null;

  return (
    <Modal
      open={payModal.isOpen}
      onClose={payModal.close}
      title={t('pay')}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={payModal.close}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" form="create-payment-form" loading={isPending} disabled={amount <= 0}>
            {t('pay')} · {fmtTJS(amount)}
          </Button>
        </div>
      }>
      <div className="bg-muted mb-4 space-y-2 rounded-xl p-3 text-base">
        <div className="flex items-center gap-2.5">
          <TransactionProducts items={transaction.items} size="sm" max={3} />
          <span className="break-words font-medium">{getTransactionTitle(transaction, t)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('fields.totalAmount')}:</span>
          <span className="font-mono font-medium">{fmtTJS(transaction.totalAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('fields.remainingAmount')}:</span>
          <span className="text-warning font-mono font-bold">{fmtTJS(remaining)}</span>
        </div>
      </div>

      <form id="create-payment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <FormInput
            control={control}
            name="amount"
            type="number"
            inputMode="decimal"
            label={t('fields.amount')}
            placeholder={t('fields.amount')}
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            required
          />
          {quickAmounts.length > 0 && (
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
          )}
        </div>
        <FormTextarea control={control} name="note" label={t('fields.note')} placeholder={t('fields.note')} />
      </form>
    </Modal>
  );
}
