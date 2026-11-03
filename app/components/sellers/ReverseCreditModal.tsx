import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import { sellersApi } from '~/api/sellers';
import { Modal } from '~/components/shared/Modal';
import { ModalFooterActions } from '~/components/shared/ModalFooterActions';
import { FormTextarea } from '~/components/ui/form/FormTextarea';
import { useInvalidateSeller } from '~/hooks/useSellerActions';
import { useForm } from '~/hooks/useForm';
import { fmtTJS } from '~/lib/format';
import { useSellersModals } from '~/routes/(crm)/sellers/store';

const schema = z.object({ note: z.string().max(500).optional() });
type Values = z.infer<typeof schema>;

/**
 * Отмена ошибочной выплаты. Запись не стирается: сервер добавляет встречную строку, и в ленте
 * видно и саму выплату, и то, что её отменили (кто, когда, почему). Сумма возвращается в «к выплате».
 */
export function ReverseCreditModal() {
  const { t } = useTranslation(['sellers', 'common']);
  const modal = useSellersModals((s) => s.reverse);
  const invalidate = useInvalidateSeller();
  const data = modal.data;

  const { control, handleSubmit, reset } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { note: '' },
  });

  const { mutate, isPending } = useMutation({
    networkMode: 'always',
    mutationFn: ({ note }: Values) =>
      sellersApi.reverseCredit({ id: data!.seller.id, creditId: data!.credit.id, note: note?.trim() || undefined }),
    onSuccess: () => {
      invalidate(data!.seller.id);
      toast.success(t('reverse.success'));
      modal.close();
      reset();
    },
    // Выплату уже успели отменить с другого устройства — картинка на экране устарела.
    onError: () => {
      if (data) invalidate(data.seller.id);
    },
  });

  if (!data) return null;

  return (
    <Modal
      open={modal.isOpen}
      onClose={modal.close}
      title={t('reverse.title')}
      footer={
        <ModalFooterActions
          formId="reverse-credit-form"
          onCancel={modal.close}
          submitLabel={t('reverse.confirm')}
          submitVariant="destructive"
          isLoading={isPending}
        />
      }>
      <form id="reverse-credit-form" className="space-y-3" onSubmit={handleSubmit((v) => mutate(v))}>
        <p className="text-sm leading-relaxed">
          {t('reverse.text', { amount: fmtTJS(data.credit.amount), name: data.seller.name })}
        </p>
        <FormTextarea
          control={control}
          name="note"
          label={t('reverse.reason')}
          placeholder={t('reverse.reasonPlaceholder')}
          maxLength={500}
        />
      </form>
    </Modal>
  );
}
