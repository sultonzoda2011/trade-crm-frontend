import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { profileApi } from '~/api/profile';
import { Modal } from '~/components/shared/Modal';
import { ModalFooterActions } from '~/components/shared/ModalFooterActions';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { useIsMobile } from '~/hooks/use-mobile';
import { useForm } from '~/hooks/useForm';
import { buildMultipart } from '~/lib/form-data';
import { queryKeys } from '~/lib/query-keys';
import { useProfileModals } from '~/routes/(crm)/profile/store';
import { updateProfileSchema, type UpdateProfileSchema } from '~/validations/profile';

export function EditProfileModal() {
  const { t } = useTranslation(['profile', 'common', 'validation']);
  const queryClient = useQueryClient();
  const editModal = useProfileModals((s) => s.edit);
  const isMobile = useIsMobile();

  const { control, handleSubmit, reset } = useForm<UpdateProfileSchema>({
    resolver: zodResolver(updateProfileSchema(t)),
    defaultValues: { name: '', email: '', image: null },
  });

  useEffect(() => {
    if (!editModal.data) return;
    reset({
      name: editModal.data.name,
      email: editModal.data.email,
      image: editModal.data.image,
    });
  }, [editModal.data, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: UpdateProfileSchema) =>
      profileApi.updateProfile(buildMultipart({ name: data.name, email: data.email, image: data.image })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profileAll() });
      toast.success(t('updateSuccess'));
      editModal.close();
      reset();
    },
    onError: () => {
      toast.error(t('updateError'));
    },
  });

  return (
    <Modal
      open={editModal.isOpen}
      onClose={editModal.close}
      title={t('editTitle')}
      footer={
        <ModalFooterActions
          formId="edit-profile-form"
          onCancel={editModal.close}
          submitLabel={t('actions.save')}
          isLoading={isPending}
        />
      }>
      <form id="edit-profile-form" onSubmit={handleSubmit((data) => mutate(data))}>
        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <FormFileInput
            control={control}
            name="image"
            label={!isMobile ? t('avatar') : undefined}
            accept="image/*"
            aspectRatio="square"
            size="compact"
            className="m-auto"
          />
          <div className="space-y-4">
            <FormInput control={control} name="name" label={t('fields.name')} placeholder={t('fields.name')} required />
            <FormInput
              control={control}
              name="email"
              type="email"
              label={t('fields.email')}
              placeholder="example@mail.com"
              required
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
