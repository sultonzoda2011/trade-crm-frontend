import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { profileApi } from '~/api/profile';
import { Modal } from '~/components/shared/Modal';
import { ModalFooterActions } from '~/components/shared/ModalFooterActions';
import { FormInput } from '~/components/ui/form/FormInput';
import { useForm } from '~/hooks/useForm';
import { useProfileModals } from '~/routes/(crm)/profile/store';
import { showSuccess } from '~/store/useSuccessStore';
import { changePasswordSchema, type ChangePasswordSchema } from '~/validations/profile';

export function ChangePasswordModal() {
  const { t } = useTranslation(['profile', 'common', 'validation']);
  const passwordModal = useProfileModals((s) => s.password);

  const { control, handleSubmit, reset } = useForm<ChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema(t)),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: ChangePasswordSchema) =>
      profileApi.updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      }),
    onSuccess: () => {
      showSuccess({ title: t('passwordSuccess') });
      passwordModal.close();
      reset();
    },
    onError: () => {
      toast.error(t('passwordError'));
    },
  });

  return (
    <Modal
      open={passwordModal.isOpen}
      onClose={passwordModal.close}
      title={t('sections.password')}
      footer={
        <ModalFooterActions
          formId="change-password-form"
          onCancel={passwordModal.close}
          submitLabel={t('actions.savePassword')}
          isLoading={isPending}
        />
      }>
      <form id="change-password-form" onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
        <FormInput
          control={control}
          name="currentPassword"
          type="password"
          label={t('fields.currentPassword')}
          placeholder={t('fields.currentPassword')}
          required
        />
        <FormInput
          control={control}
          name="newPassword"
          type="password"
          label={t('fields.newPassword')}
          placeholder={t('fields.newPassword')}
          required
        />
        <FormInput
          control={control}
          name="confirmPassword"
          type="password"
          label={t('fields.confirmPassword')}
          placeholder={t('fields.confirmPassword')}
          required
        />
      </form>
    </Modal>
  );
}
