import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { sellersApi } from '~/api/sellers';
import { Modal } from '~/components/shared/Modal';
import { Button } from '~/components/ui/button';
import { FormInput } from '~/components/ui/form/FormInput';
import { getRoleOptions } from '~/config/enumOptions';
import { useForm } from '~/hooks/useForm';
import { useSellersModals } from '~/routes/(crm)/sellers/store';
import { createSellerSchema, type CreateSellerSchema } from '~/validations/seller';

export function CreateSellerModal() {
  const { t } = useTranslation(['sellers', 'common', 'validation']);
  const queryClient = useQueryClient();
  const createModal = useSellersModals((s) => s.create);

  const roleOptions = getRoleOptions(t);

  const { control, handleSubmit, reset } = useForm<CreateSellerSchema>({
    resolver: zodResolver(createSellerSchema(t)),
    defaultValues: { name: '', email: '', password: '' },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateSellerSchema) => sellersApi.create({ request: data as never }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sellers'] });
      toast.success(t('createSuccess'));
      createModal.close();
      reset();
    },
    onError: () => {
      toast.error(t('createError'));
    },
  });

  function onSubmit(data: CreateSellerSchema) {
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
          <Button type="submit" form="create-seller-form" disabled={isPending}>
            {t('actions.create')}
          </Button>
        </div>
      }>
      <form id="create-seller-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          placeholder="••••••••"
          required
        />
      </form>
    </Modal>
  );
}
