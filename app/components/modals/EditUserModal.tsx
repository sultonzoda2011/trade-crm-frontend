import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { usersApi } from '~/api/users';
import { Button } from '~/components/ui/button';
import { FormCustomSelect } from '~/components/ui/form/FormCustomSelect';
import { FormInput } from '~/components/ui/form/FormInput';
import { getRoleOptions } from '~/config/enumOptions';
import { useForm } from '~/hooks/useForm';
import { Modal } from '~/components/shared/Modal';
import { updateUserSchema, type UpdateUserSchema } from '~/validations/user';
import { useUsersModals } from '~/routes/(crm)/users/store';

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
    });
  }, [editModal.data, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: UpdateUserSchema) => {
      const request: Record<string, unknown> = { name: data.name, email: data.email, role: data.role };
      if (data.password) request.password = data.password;
      return usersApi.update({ request: request as never, id: editModal.data!.id });
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
      }
    >
      <form id="edit-user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        <FormCustomSelect
          control={control}
          name="role"
          label={t('fields.role')}
          options={roleOptions}
          placeholder={t('fields.role')}
          required
        />
      </form>
    </Modal>
  );
}
