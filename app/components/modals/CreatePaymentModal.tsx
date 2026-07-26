import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { transactionsApi } from '~/api/transactions';
import { Modal } from '~/components/shared/Modal';
import { Button } from '~/components/ui/button';
import { FormInput } from '~/components/ui/form/FormInput';
import { FormTextarea } from '~/components/ui/form/FormTextarea';
import { useForm } from '~/hooks/useForm';
import { fmtTJS } from '~/lib/format';
import { useTransactionsModals } from '~/routes/(crm)/transactions/store';
import { createPaymentSchema, type CreatePaymentSchema } from '~/validations/transaction';

export function CreatePaymentModal() {
  const { t } = useTranslation(['transactions', 'common', 'validation']);
  const queryClient = useQueryClient();
  const payModal = useTransactionsModals((s) => s.pay);
  const transaction = payModal.data;

  const { control, handleSubmit, reset } = useForm<CreatePaymentSchema>({
    resolver: zodResolver(createPaymentSchema(t)),
    defaultValues: {
      amount: transaction?.remainingAmount ?? 0,
      note: '',
    },
  });

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
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={payModal.close}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" form="create-payment-form" disabled={isPending}>
            {t('pay')}
          </Button>
        </div>
      }>
      <div className="bg-muted/50 mb-4 rounded-lg p-3 text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('fields.id')}:</span>
          <span className="font-mono font-medium">#{transaction.id.slice(0, 8)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('fields.totalAmount')}:</span>
          <span className="font-mono font-medium">{fmtTJS(transaction.totalAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('fields.remainingAmount')}:</span>
          <span className="font-mono font-bold text-warning">{fmtTJS(transaction.remainingAmount)}</span>
        </div>
      </div>

      <form id="create-payment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormInput
          control={control}
          name="amount"
          type="number"
          label={t('fields.amount')}
          placeholder={t('fields.amount')}
          required
        />
        <FormTextarea
          control={control}
          name="note"
          label={t('fields.note')}
          placeholder={t('fields.note')}
        />
      </form>
    </Modal>
  );
}
