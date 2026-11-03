import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { sellersApi } from '~/api/sellers';
import { Modal } from '~/components/shared/Modal';
import { ModalFooterActions } from '~/components/shared/ModalFooterActions';
import { FormInput } from '~/components/ui/form/FormInput';
import { FormTextarea } from '~/components/ui/form/FormTextarea';
import { useInvalidateSeller } from '~/hooks/useSellerActions';
import { useForm } from '~/hooks/useForm';
import { fmtTJS } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';
import { cn } from '~/lib/utils';
import { useSellersModals } from '~/routes/(crm)/sellers/store';
import { showSuccess } from '~/store/useSuccessStore';
import { createSellerCreditSchema, type CreateSellerCreditSchema } from '~/validations/seller';

/**
 * Выплата продавцу. Баланс читается заново при каждом открытии, а не берётся с карточки:
 * пока шторка была закрыта, могла пройти ещё одна продажа или чужая выплата. Сумма по умолчанию —
 * весь баланс; «Останется» пересчитывается на лету, чтобы владелец видел итог до нажатия.
 * Окончательную проверку делает сервер под блокировкой — две выплаты подряд не уведут баланс в минус.
 */
export function PayoutSellerModal() {
  const { t } = useTranslation(['sellers', 'common', 'validation']);
  const invalidate = useInvalidateSeller();
  const payoutModal = useSellersModals((s) => s.payout);
  const seller = payoutModal.data;

  const { data: balanceRes, isFetching } = useQuery({
    queryKey: queryKeys.sub('sellers', 'balance', seller?.id),
    queryFn: () => sellersApi.getBalance(seller!.id),
    enabled: !!seller && payoutModal.isOpen,
    staleTime: 0,
  });

  const balance = balanceRes?.data?.balance ?? 0;

  const { control, handleSubmit, reset } = useForm<CreateSellerCreditSchema>({
    resolver: zodResolver(createSellerCreditSchema(t, balance)),
    defaultValues: { amount: '', note: '' },
  });

  // Подставляем весь баланс, когда он пришёл (и когда обновился), пока сумму не трогали руками.
  useEffect(() => {
    if (payoutModal.isOpen && balance > 0) reset({ amount: balance, note: '' });
  }, [payoutModal.isOpen, balance, reset]);

  const amountValue = useWatch({ control, name: 'amount' });
  const amount = Number(amountValue);
  const remaining = Number.isFinite(amount) ? Math.round((balance - amount) * 100) / 100 : balance;

  const { mutate, isPending } = useMutation({
    networkMode: 'always',
    mutationFn: (data: CreateSellerCreditSchema) =>
      sellersApi.createCredit({
        id: seller!.id,
        request: { amount: Number(data.amount), note: data.note?.trim() || undefined },
      }),
    onSuccess: (_response, variables) => {
      invalidate(seller!.id);
      showSuccess({ title: t('sellers:payout.success'), amount: Number(variables.amount) });
      payoutModal.close();
      reset({ amount: '', note: '' });
    },
    // «Превышает баланс» / «нечего выплачивать» — на экране старая сумма: перечитываем баланс.
    onError: () => {
      if (seller) invalidate(seller.id);
    },
  });

  if (!seller) return null;

  return (
    <Modal
      open={payoutModal.isOpen}
      onClose={payoutModal.close}
      title={t('sellers:payout.title')}
      footer={
        <ModalFooterActions
          formId="payout-seller-form"
          onCancel={payoutModal.close}
          submitLabel={t('sellers:payout.submit')}
          isLoading={isPending}
          disabled={balance <= 0 || isFetching}
        />
      }>
      <div className="bg-muted/50 mb-4 space-y-1 rounded-2xl p-3 text-sm">
        <p className="font-medium">{seller.name}</p>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('sellers:balance.toPay')}</span>
          <span className="text-success font-mono font-semibold">{fmtTJS(balance)}</span>
        </div>
      </div>

      <form id="payout-seller-form" className="space-y-1" onSubmit={handleSubmit((data) => mutate(data))}>
        <FormInput
          control={control}
          name="amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          label={t('sellers:payout.amount')}
          placeholder="0"
          required
        />
        <p className={cn('px-1 text-xs', remaining < 0 ? 'text-destructive' : 'text-muted-foreground')}>
          {t('sellers:payout.remaining', { amount: fmtTJS(Math.max(remaining, 0)) })}
        </p>
        <FormTextarea
          control={control}
          name="note"
          label={t('sellers:payout.note')}
          placeholder={t('sellers:payout.notePlaceholder')}
          maxLength={500}
        />
        <p className="text-muted-foreground text-xs leading-relaxed">{t('sellers:payout.hint')}</p>
      </form>
    </Modal>
  );
}
