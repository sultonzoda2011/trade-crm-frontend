import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { debtorsApi } from '~/api/debtors';
import { Modal } from '~/components/shared/Modal';
import { Button } from '~/components/ui/button';
import { FormInput } from '~/components/ui/form/FormInput';
import { useForm } from '~/hooks/useForm';
import { useDebtorsModals } from '~/routes/(crm)/debtors/store';
import { requestDebtorSchema, type RequestDebtorSchema } from '~/validations/debtor';

export function EditDebtorModal() {
  const { t } = useTranslation(['debtors', 'common', 'validation']);
  const queryClient = useQueryClient();
  const editModal = useDebtorsModals((s) => s.edit);

  const { control, handleSubmit, reset } = useForm<RequestDebtorSchema>({
    resolver: zodResolver(requestDebtorSchema(t)),
  });

  useEffect(() => {
    if (!editModal.data) return;
    reset({
      name: editModal.data.name,
      phone: editModal.data.phone,
    });
  }, [editModal.data, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: ({ request, id }: { request: RequestDebtorSchema; id: string }) => debtorsApi.update({ request, id }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['debtors'] });
      toast.success(t('updateSuccess'));
      editModal.close();
    },
    onError: () => {
      toast.error(t('updateError'));
    },
  });

  function onSubmit(request: RequestDebtorSchema) {
    if (!editModal.data) return;
    mutate({ request, id: editModal.data.id });
  }

  return (
    <Modal
      open={editModal.isOpen}
      onClose={editModal.close}
      title={t('actions.edit')}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={editModal.close}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" form="edit-debtor-form" disabled={isPending}>
            {t('actions.save')}
          </Button>
        </div>
      }>
      <form id="edit-debtor-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormInput
          control={control}
          name="name"
          label={t('fields.fullName')}
          placeholder={t('fields.fullName')}
          required
        />
        <FormInput control={control} name="phone" type="tel" inputMode="tel" label={t('fields.phone')} placeholder={t('fields.phone')} required />
      </form>
    </Modal>
  );
}
