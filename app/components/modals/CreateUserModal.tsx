import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { usersApi } from '~/api/users';
import { Modal } from '~/components/shared/Modal';
import { Button } from '~/components/ui/button';
import { FormCustomSelect } from '~/components/ui/form/FormCustomSelect';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { getRoleOptions } from '~/config/enumOptions';
import { useForm } from '~/hooks/useForm';
import { appendToFormData } from '~/lib/form-data';
import { useUsersModals } from '~/routes/(crm)/users/store';
import { createUserSchema, type CreateUserSchema } from '~/validations/user';

export function CreateUserModal() {
  const { t } = useTranslation(['users', 'common', 'validation']);
  const queryClient = useQueryClient();
  const createModal = useUsersModals((s) => s.create);
  const [showPassword, setShowPassword] = useState(false);

  const roleOptions = getRoleOptions(t);

  const { control, handleSubmit, reset } = useForm<CreateUserSchema>({
    resolver: zodResolver(createUserSchema(t)),
    defaultValues: { name: '', email: '', password: '', role: '', image: null },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateUserSchema) => {
      const payload: Record<string, unknown> = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      };
      if (data.image instanceof File) {
        payload.image = data.image;
      }
      return usersApi.create(appendToFormData(payload));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('users:createSuccess'));
      createModal.close();
      reset();
    },
    onError: () => {
      toast.error(t('users:createError'));
    },
  });

  function onSubmit(data: CreateUserSchema) {
    mutate(data);
  }

  return (
    <Modal
      open={createModal.isOpen}
      onClose={createModal.close}
      title={t('create')}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={createModal.close}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" form="create-user-form" disabled={isPending}>
            {t('actions.create')}
          </Button>
        </div>
      }>
      <form id="create-user-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <FormFileInput
            control={control}
            name="image"
            label={t('common:fields.image')}
            accept="image/*"
            aspectRatio="square"
            size="compact"
          />
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
              type={showPassword ? 'text' : 'password'}
              endIcon={
                showPassword ? (
                  <EyeOff
                    className="h-4 w-4 cursor-pointer bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  />
                ) : (
                  <Eye className="h-4 w-4 cursor-pointer" onClick={() => setShowPassword(!showPassword)} />
                )
              }
              label={t('fields.password')}
              placeholder="••••••••"
              required
            />
            <FormCustomSelect
              control={control}
              name="role"
              label={t('fields.role')}
              options={roleOptions}
              placeholder={t('fields.role')}
              required
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
