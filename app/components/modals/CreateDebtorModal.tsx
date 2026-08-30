import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { debtorsApi } from '~/api/debtors';
import { Modal } from '~/components/shared/Modal';
import { Button } from '~/components/ui/button';
import { FormInput } from '~/components/ui/form/FormInput';
import { useForm } from '~/hooks/useForm';
import { useDebtorsModals } from '~/routes/(crm)/debtors/store';
import { requestDebtorSchema, type RequestDebtorSchema } from '~/validations/debtor';

export function CreateDebtorModal() {
  const { t } = useTranslation(['debtors', 'common', 'validation']);
  const queryClient = useQueryClient();
  const createModal = useDebtorsModals((s) => s.create);

  const { control, handleSubmit, reset } = useForm<RequestDebtorSchema>({
    resolver: zodResolver(requestDebtorSchema(t)),
    defaultValues: { name: '', phone: '' },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: debtorsApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['debtors'] });
      toast.success(t('debtors:createSuccess'));
      createModal.close();
      reset();
    },
    onError: () => {
      toast.error(t('debtors:createError'));
    },
  });

  function onSubmit(request: RequestDebtorSchema) {
    mutate(request);
  }

  return (
    <Modal
      open={createModal.isOpen}
      onClose={createModal.close}
      title={t('actions.create')}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={createModal.close}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" form="create-debtor-form" disabled={isPending}>
            {t('actions.save')}
          </Button>
        </div>
      }>
      <form id="create-debtor-form" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          control={control}
          name="name"
          label={t('fields.fullName')}
          placeholder={t('fields.fullName')}
          required
        />
        <FormInput
          control={control}
          name="phone"
          type="tel"
          inputMode="tel"
          label={t('fields.phone')}
          placeholder={t('fields.phone')}
          required
        />
      </form>
    </Modal>
  );
}
