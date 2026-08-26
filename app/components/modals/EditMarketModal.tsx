import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { marketsApi } from '~/api/markets';
import { usersApi } from '~/api/users';
import { Modal } from '~/components/shared/Modal';
import { Button } from '~/components/ui/button';
import { FormCustomSelect } from '~/components/ui/form/FormCustomSelect';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { Action } from '~/config/actions';
import { useAsyncSelectOptions } from '~/hooks/useAsyncSelectOptions';
import { useIsMobile } from '~/hooks/use-mobile';
import { useCan } from '~/hooks/useCan';
import { useForm } from '~/hooks/useForm';
import { appendToFormData } from '~/lib/form-data';
import { useMarketsModals } from '~/routes/(crm)/markets/store';
import { Role } from '~/types/common';
import { updateMarketSchema, type UpdateMarketSchema } from '~/validations/market';

export function EditMarketModal() {
  const { t } = useTranslation(['markets', 'common', 'validation']);
  const queryClient = useQueryClient();
  const { can } = useCan();
  const editModal = useMarketsModals((s) => s.edit);
  const canManageUsers = can(Action.USERS_VIEW);

  // Seed with the market's current owner so its name shows without a first fetch, then search
  // owners by name server-side (role-filtered to OWNER by the API).
  const currentOwner = editModal.data?.owner;
  const ownerSeed = useMemo(
    () => (currentOwner ? [{ id: currentOwner.id, name: currentOwner.name }] : undefined),
    [currentOwner]
  );

  const owners = useAsyncSelectOptions({
    queryKey: ['users', 'owners'],
    fetcher: async (search) =>
      ((await usersApi.getAll(1, 20, { search: search || undefined }, [{ key: 'role', value: Role.Owner }]))?.data?.data ?? []).map((u) => ({
        id: u.id,
        name: u.name,
      })),
    getValue: (u) => u.id,
    getLabel: (u) => u.name,
    enabled: editModal.isOpen && canManageUsers,
    seed: ownerSeed,
  });

  const { control, handleSubmit, reset } = useForm<UpdateMarketSchema>({
    resolver: zodResolver(updateMarketSchema(t)),
  });

  useEffect(() => {
    if (!editModal.data) return;
    reset({
      name: editModal.data.name,
      address: editModal.data.address,
      ownerId: editModal.data.owner.id,
      image: editModal.data.image,
    });
  }, [editModal.data, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: UpdateMarketSchema) => {
      const payload: Record<string, unknown> = {
        name: data.name,
        address: data.address,
        ownerId: data.ownerId,
      };
      if (data.image instanceof File) {
        payload.image = data.image;
      }
      return marketsApi.update({ formData: appendToFormData(payload), id: editModal.data!.id });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['markets'] });
      void queryClient.invalidateQueries({ queryKey: ['market'] });
      toast.success(t('updateSuccess'));
      editModal.close();
    },
    onError: () => {
      toast.error(t('updateError'));
    },
  });

  function onSubmit(data: UpdateMarketSchema) {
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
          <Button type="submit" form="edit-market-form" disabled={isPending}>
            {t('actions.save')}
          </Button>
        </div>
      }>
      <form id="edit-market-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <FormFileInput
            control={control}
            name="image"
            label={!isMobile ? t('common:fields.image') : undefined}
            accept="image/*"
            aspectRatio="square"
            size="compact"
            className="m-auto sm:m-0"
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
            {canManageUsers && (
              <FormCustomSelect
                control={control}
                name="ownerId"
                label={t('fields.ownerId')}
                options={owners.options}
                onSearch={owners.onSearch}
                loading={owners.loading}
                placeholder={t('fields.ownerId')}
                required
              />
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
