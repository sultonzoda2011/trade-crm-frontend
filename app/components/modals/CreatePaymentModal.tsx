import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Modal } from '~/components/shared/Modal';
import { ModalFooterActions } from '~/components/shared/ModalFooterActions';
import { TransactionProducts, getTransactionTitle } from '~/components/transactions/TransactionProducts';
import { FormInput } from '~/components/ui/form/FormInput';
import { FormTextarea } from '~/components/ui/form/FormTextarea';
import { useDetachedMutation } from '~/hooks/useDetachedMutation';
import { useForm } from '~/hooks/useForm';
import { fmtNum, fmtTJS } from '~/lib/format';
import { createIdempotencyKey, OFFLINE_MUTATION_KEYS, type QueuedPayTransactionVars } from '~/lib/offline-mutations';
import { cn } from '~/lib/utils';
import { useTransactionsModals } from '~/routes/(crm)/transactions/store';
import { createPaymentSchema, type CreatePaymentSchema } from '~/validations/transactions';

export function CreatePaymentModal() {
  const { t } = useTranslation(['transactions', 'common', 'validation']);
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

  // Отправка, повторы, инвалидация и тосты — в setMutationDefaults (offline-mutations.ts). Модалка
  // закрывается, как только оплату можно считать принятой, — не дожидаясь слабой сети: оплата
  // остаётся в очереди, а остаток в списке уже уменьшен (см. offline-overlay.ts).
  const { run, isSubmitting: isPending } = useDetachedMutation<QueuedPayTransactionVars>(
    OFFLINE_MUTATION_KEYS.payTransaction
  );

  function onSubmit(data: CreatePaymentSchema) {
    if (!transaction?.id) return;

    run(
      {
        id: transaction.id,
        request: data,
        idempotencyKey: createIdempotencyKey(),
        preview: { debtorId: transaction.debtorId ?? null },
      },
      {
        release: () => {
          payModal.close();
          reset();
        },
        offlineMessage: t('transactions:payQueuedOffline'),
        slowMessage: t('transactions:payQueuedSlow'),
      }
    );
  }

  if (!transaction) return null;

  return (
    <Modal
      open={payModal.isOpen}
      onClose={payModal.close}
      title={t('pay')}
      footer={
        <ModalFooterActions
          formId="create-payment-form"
          onCancel={payModal.close}
          submitLabel={`${t('pay')} · ${fmtTJS(amount)}`}
          isLoading={isPending}
          disabled={amount <= 0}
        />
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
