import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { sellersApi } from '~/api/sellers';
import { Modal } from '~/components/shared/Modal';
import { Button } from '~/components/ui/button';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { useIsMobile } from '~/hooks/use-mobile';
import { useForm } from '~/hooks/useForm';
import { appendToFormData } from '~/lib/form-data';
import { useSellersModals } from '~/routes/(crm)/sellers/store';
import { updateSellerSchema, type UpdateSellerSchema } from '~/validations/seller';

export function EditSellerModal() {
  const { t } = useTranslation(['sellers', 'common', 'validation']);
  const queryClient = useQueryClient();
  const editModal = useSellersModals((s) => s.edit);

  const { control, handleSubmit, reset } = useForm<UpdateSellerSchema>({
    resolver: zodResolver(updateSellerSchema(t)),
  });

  useEffect(() => {
    if (!editModal.data) return;
    reset({
      name: editModal.data.name,
      email: editModal.data.email,
      password: '',
      image: editModal.data.image,
    });
  }, [editModal.data, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: UpdateSellerSchema) => {
      const payload: Record<string, unknown> = { name: data.name, email: data.email };
      if (data.password) payload.password = data.password;
      if (data.image instanceof File) {
        payload.image = data.image;
      }
      return sellersApi.update({ formData: appendToFormData(payload), id: editModal.data!.id });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sellers'] });
      toast.success(t('sellers:updateSuccess'));
      editModal.close();
    },
    onError: () => {
      toast.error(t('sellers:updateError'));
    },
  });

  function onSubmit(data: UpdateSellerSchema) {
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
          <Button type="submit" form="edit-seller-form" disabled={isPending}>
            {t('actions.save')}
          </Button>
        </div>
      }>
      <form id="edit-seller-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <FormFileInput
            control={control}
            name="image"
            label={!isMobile ? t('common:fields.image') : undefined}
            accept="image/*"
            aspectRatio="square"
            size="compact"            className="m-auto"

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
              type="password"
              label={t('fields.password')}
              placeholder={t('fields.password')}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
