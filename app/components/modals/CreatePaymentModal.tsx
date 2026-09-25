import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { transactionsApi } from '~/api/transactions';
import { Modal } from '~/components/shared/Modal';
import { TransactionProducts, getTransactionTitle } from '~/components/transactions/TransactionProducts';
import { Button } from '~/components/ui/button';
import { FormInput } from '~/components/ui/form/FormInput';
import { FormTextarea } from '~/components/ui/form/FormTextarea';
import { useForm } from '~/hooks/useForm';
import { fmtTJS } from '~/lib/format';
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
          { label: t('payModal.half', { ns: 'transactions' }), value: Math.round(remaining / 2) },
          { label: t('payModal.full', { ns: 'transactions' }), value: remaining },
        ]
      : [];

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreatePaymentSchema) => {
      if (!transaction?.id) throw new Error('No transaction ID');
      return transactionsApi.pay({ request: data, id: transaction.id });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      if (transaction?.id) {
        void queryClient.invalidateQueries({ queryKey: ['transaction', transaction.id] });
      }
      toast.success(t('transactions:paySuccess'));
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
          <Button type="submit" form="create-payment-form" disabled={isPending || amount <= 0}>
            {t('pay')} · {fmtTJS(amount)}
          </Button>
        </div>
      }>
      <div className="bg-muted/50 mb-4 space-y-2 rounded-lg p-3 text-sm">
        <div className="flex items-center gap-2.5">
          <TransactionProducts items={transaction.items} size="sm" max={3} />
          <span className="truncate font-medium">{getTransactionTitle(transaction, t)}</span>
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
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    amount === q.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:bg-muted'
                  )}>
                  {q.label} · {fmtTJS(q.value)}
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
