import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { profileApi } from '~/api/profile';
import { Modal } from '~/components/shared/Modal';
import { Button } from '~/components/ui/button';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { useIsMobile } from '~/hooks/use-mobile';
import { useForm } from '~/hooks/useForm';
import { appendToFormData } from '~/lib/form-data';
import { useProfileModals } from '~/routes/(crm)/profile/store';
import { updateProfileSchema, type UpdateProfileSchema } from '~/validations/profile';

export function EditProfileModal() {
  const { t } = useTranslation(['profile', 'common', 'validation']);
  const queryClient = useQueryClient();
  const editModal = useProfileModals((s) => s.edit);

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
    mutationFn: (data: UpdateProfileSchema) => {
      const payload: Record<string, unknown> = {
        name: data.name,
        email: data.email,
      };
      if (data.image instanceof File) {
        payload.image = data.image;
      }
      return profileApi.updateProfile(appendToFormData(payload));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(t('updateSuccess'));
      editModal.close();
      reset();
    },
    onError: () => {
      toast.error(t('updateError'));
    },
  });

  function onSubmit(data: UpdateProfileSchema) {
    mutate(data);
  }
  const isMobile = useIsMobile();

  return (
    <Modal
      open={editModal.isOpen}
      onClose={editModal.close}
      title={t('editTitle')}
      footer={
        <div className="flex w-full gap-2 sm:w-auto sm:justify-end">
          <Button variant="outline" className="flex-1 sm:flex-initial" onClick={editModal.close}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" form="edit-profile-form" className="flex-1 sm:flex-initial" disabled={isPending}>
            {t('actions.save')}
          </Button>
        </div>
      }>
      <form id="edit-profile-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <FormFileInput
            control={control}
            name="image"
            label={!isMobile ? t('avatar') : undefined}
            accept="image/*"
            aspectRatio="square"
            size="compact"            className="m-auto"

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
