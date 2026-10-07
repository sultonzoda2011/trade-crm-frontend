import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { showSuccess } from '~/store/useSuccessStore';
import { sellersApi } from '~/api/sellers';
import { Modal } from '~/components/shared/Modal';
import { Button } from '~/components/ui/button';
import { FormInput } from '~/components/ui/form/FormInput';
import { FormTextarea } from '~/components/ui/form/FormTextarea';
import { useForm } from '~/hooks/useForm';
import { fmtTJS } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';
import { useSellersModals } from '~/routes/(crm)/sellers/store';
import { createSellerCreditSchema, type CreateSellerCreditSchema } from '~/validations/seller';

/**
 * Выдача накопленной надбавки продавцу. Баланс запрашивается заново при
 * каждом открытии (а не берётся из уже загруженного на странице продавца
 * значения) — на случай если между открытием страницы и нажатием "Выдать"
 * успела пройти ещё одна транзакция с markup.
 */
export function PayoutSellerModal() {
  const { t } = useTranslation(['sellers', 'common', 'validation']);
  const queryClient = useQueryClient();
  const payoutModal = useSellersModals((s) => s.payout);
  const seller = payoutModal.data;

  const { data: balanceRes } = useQuery({
    queryKey: queryKeys.sub('sellers', 'balance', seller?.id),
    queryFn: () => sellersApi.getBalance(seller!.id),
    enabled: !!seller && payoutModal.isOpen,
    staleTime: 0,
  });

  const balance = balanceRes?.data?.balance ?? 0;

  const { control, handleSubmit, reset } = useForm<CreateSellerCreditSchema>({
    resolver: zodResolver(createSellerCreditSchema(t, balance)),
    values: { amount: balance, note: '' },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateSellerCreditSchema) => {
      if (!seller?.id) throw new Error('No seller ID');
      return sellersApi.createCredit({
        id: seller.id,
        request: { amount: Number(data.amount), note: data.note || undefined },
      });
    },
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sub('sellers', 'balance', seller?.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sub('sellers', 'credits', seller?.id) });
      showSuccess({ title: t('sellers:payoutSuccess'), amount: Number(variables.amount) });
      payoutModal.close();
      reset();
    },
    onError: () => {
      toast.error(t('sellers:payoutError'));
    },
  });

  function onSubmit(data: CreateSellerCreditSchema) {
    mutate(data);
  }

  if (!seller) return null;

  return (
    <Modal
      open={payoutModal.isOpen}
      onClose={payoutModal.close}
      title={t('sellers:payoutModalTitle')}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={payoutModal.close}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" form="payout-seller-form" loading={isPending} disabled={balance <= 0}>
            {t('sellers:payout')}
          </Button>
        </div>
      }>
      <div className="bg-muted/50 mb-4 space-y-1 rounded-xl p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{seller.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('sellers:balance')}:</span>
          <span className="text-success font-mono font-bold">{fmtTJS(balance)}</span>
        </div>
      </div>

      <form id="payout-seller-form" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          control={control}
          name="amount"
          type="number"
          inputMode="decimal"
          label={t('fields.amount', { ns: 'transactions' })}
          placeholder={t('fields.amount', { ns: 'transactions' })}
          required
        />
        <FormTextarea
          control={control}
          name="note"
          label={t('fields.note', { ns: 'transactions' })}
          placeholder={t('fields.note', { ns: 'transactions' })}
        />
        <p className="text-muted-foreground text-xs leading-relaxed">{t('sellers:payoutHint')}</p>
      </form>
    </Modal>
  );
}
