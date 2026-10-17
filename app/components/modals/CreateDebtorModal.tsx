import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Modal } from '~/components/shared/Modal';
import { Button } from '~/components/ui/button';
import { FormInput } from '~/components/ui/form/FormInput';
import { useCreateDebtor, type CreatedDebtor } from '~/hooks/useCreateDebtor';
import { useForm } from '~/hooks/useForm';
import { useDebtorsModals } from '~/routes/(crm)/debtors/store';
import { requestDebtorSchema, type RequestDebtorSchema } from '~/validations/debtor';

interface CreateDebtorModalProps {
  /** Должник создан (или поставлен в очередь): вызывающая форма может сразу выбрать его. */
  onCreated?: (debtor: CreatedDebtor) => void;
}

export function CreateDebtorModal({ onCreated }: CreateDebtorModalProps) {
  const { t } = useTranslation(['debtors', 'common', 'validation']);
  const createModal = useDebtorsModals((s) => s.create);

  const { control, handleSubmit, reset } = useForm<RequestDebtorSchema>({
    resolver: zodResolver(requestDebtorSchema(t)),
    defaultValues: { name: '', phone: '' },
  });

  const { create, isSubmitting: isPending } = useCreateDebtor();

  function onSubmit(request: RequestDebtorSchema) {
    create(request, (debtor) => {
      createModal.close();
      reset();
      onCreated?.(debtor);
    });
  }

  return (
    <Modal
      open={createModal.isOpen}
      onClose={createModal.close}
      title={t('actions.create')}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={createModal.close}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" form="create-debtor-form" loading={isPending}>
            {t('actions.save')}
          </Button>
        </div>
      }>
      <form id="create-debtor-form" className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
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
