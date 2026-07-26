import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { marketsApi } from '~/api/markets';
import { usersApi } from '~/api/users';
import { Modal } from '~/components/shared/Modal';
import { Button } from '~/components/ui/button';
import { FormCustomSelect } from '~/components/ui/form/FormCustomSelect';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { useForm } from '~/hooks/useForm';
import { appendToFormData } from '~/lib/form-data';
import { mapToOptions } from '~/lib/mapToOptions';
import { useMarketsModals } from '~/routes/(crm)/markets/store';
import type { UsersResponse } from '~/types/users';
import { createMarketSchema, type CreateMarketSchema } from '~/validations/market';

export function CreateMarketModal() {
  const { t } = useTranslation(['markets', 'common', 'validation']);
  const queryClient = useQueryClient();
  const createModal = useMarketsModals((s) => s.create);

  const { data: usersResponse } = useQuery<UsersResponse>({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
    staleTime: 60_000,
  });

  const userOptions = mapToOptions(usersResponse?.data?.data ?? [], 'id', 'name');
  const { control, handleSubmit, reset } = useForm<CreateMarketSchema>({
    resolver: zodResolver(createMarketSchema(t)),
    defaultValues: { name: '', address: '', ownerId: '', image: null },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateMarketSchema) => {
      const payload: Record<string, unknown> = {
        name: data.name,
        address: data.address,
        ownerId: data.ownerId,
      };
      if (data.image instanceof File) {
        payload.image = data.image;
      }
      const formData = appendToFormData(payload);
      return marketsApi.create(formData);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['markets'] });
      toast.success(t('markets:createSuccess'));
      createModal.close();
      reset();
    },
    onError: () => {
      toast.error(t('markets:createError'));
    },
  });

  function onSubmit(data: CreateMarketSchema) {
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
          <Button type="submit" form="create-market-form" disabled={isPending}>
            {t('actions.create')}
          </Button>
        </div>
      }>
      <form id="create-market-form" onSubmit={handleSubmit(onSubmit)}>
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
            <FormInput control={control} name="name" label={t('fields.name')} placeholder={t('fields.name')} required />
            <FormInput
              control={control}
              name="address"
              label={t('fields.address')}
              placeholder={t('fields.address')}
              required
            />
            <FormCustomSelect
              control={control}
              name="ownerId"
              label={t('fields.ownerId')}
              options={userOptions}
              placeholder={t('fields.ownerId')}
              required
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
