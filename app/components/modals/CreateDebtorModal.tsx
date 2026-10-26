import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { DebtorFormFields } from '~/components/debtors/DebtorFormFields';
import { Modal } from '~/components/shared/Modal';
import { ModalFooterActions } from '~/components/shared/ModalFooterActions';
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
        <ModalFooterActions
          formId="create-debtor-form"
          onCancel={createModal.close}
          submitLabel={t('actions.save')}
          isLoading={isPending}
        />
      }>
      <form id="create-debtor-form" className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <DebtorFormFields control={control} t={t} grid={false} />
      </form>
    </Modal>
  );
}
