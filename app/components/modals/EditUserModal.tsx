import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { usersApi } from '~/api/users';
import { Modal } from '~/components/shared/Modal';
import { Button } from '~/components/ui/button';
import { FormCustomSelect } from '~/components/ui/form/FormCustomSelect';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { getRoleOptions } from '~/config/enumOptions';
import { useIsMobile } from '~/hooks/use-mobile';
import { useForm } from '~/hooks/useForm';
import { appendToFormData } from '~/lib/form-data';
import { useUsersModals } from '~/routes/(crm)/users/store';
import { updateUserSchema, type UpdateUserSchema } from '~/validations/user';

export function EditUserModal() {
  const { t } = useTranslation(['users', 'common', 'validation']);
  const queryClient = useQueryClient();
  const editModal = useUsersModals((s) => s.edit);

  const roleOptions = getRoleOptions(t);

  const { control, handleSubmit, reset } = useForm<UpdateUserSchema>({
    resolver: zodResolver(updateUserSchema(t)),
  });

  useEffect(() => {
    if (!editModal.data) return;
    reset({
      name: editModal.data.name,
      email: editModal.data.email,
      password: '',
      role: editModal.data.role,
      image: editModal.data.image,
    });
  }, [editModal.data, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: UpdateUserSchema) => {
      const payload: Record<string, unknown> = {
        name: data.name,
        email: data.email,
        role: data.role,
      };
      if (data.password) payload.password = data.password;
      if (data.image instanceof File) {
        payload.image = data.image;
      }
      return usersApi.update({ formData: appendToFormData(payload), id: editModal.data!.id });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('updateSuccess'));
      editModal.close();
    },
    onError: () => {
      toast.error(t('updateError'));
    },
  });

  function onSubmit(data: UpdateUserSchema) {
    mutate(data);
  }
  const isMobile = useIsMobile();

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
          <Button type="submit" form="edit-user-form" disabled={isPending}>
            {t('actions.save')}
          </Button>
        </div>
      }>
      <form id="edit-user-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <div className={`${isMobile ? 'flex items-center justify-center' : ''} space-y-4`}>
            <FormFileInput
              control={control}
              name="image"
              label={!isMobile ? t('common:fields.image') : undefined}
              accept="image/*"
              aspectRatio="square"
              size="compact"
              className="m-auto sm:m-0"
            />

            {!isMobile && (
              <FormCustomSelect
                control={control}
                name="role"
                label={t('fields.role')}
                options={roleOptions}
                placeholder={t('fields.role')}
                required
                className="mt-0.75"
              />
            )}
          </div>
          <div className="space-y-4">
            <FormInput
              control={control}
              name="name"
              label={t('fields.fullName')}
              placeholder={t('fields.fullName')}
              required
            />
            <FormInput
              control={control}
              name="email"
              type="email"
              label={t('fields.email')}
              placeholder="example@mail.com"
              required
            />
            <FormInput
              control={control}
              name="password"
              type="password"
              label={t('fields.password')}
              placeholder={t('fields.password')}
            />
            {isMobile && (
              <FormCustomSelect
                control={control}
                name="role"
                label={t('fields.role')}
                options={roleOptions}
                placeholder={t('fields.role')}
                required
              />
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
