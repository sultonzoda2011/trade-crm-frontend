import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { marketsApi } from '~/api/markets';
import { usersApi } from '~/api/users';
import { Panel } from '~/components/layout/Panel';
import { FormGrid } from '~/components/shared/FormGrid';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { FormCustomSelect } from '~/components/ui/form/FormCustomSelect';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { useAsyncSelectOptions } from '~/hooks/useAsyncSelectOptions';
import { useForm } from '~/hooks/useForm';
import { appendToFormData } from '~/lib/form-data';
import { Role } from '~/types/common';
import { createMarketSchema, type CreateMarketSchema } from '~/validations/market';

export default function CreateMarketPage() {
  const { t } = useTranslation(['markets', 'common', 'validation']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const owners = useAsyncSelectOptions({
    queryKey: ['users', 'owners'],
    fetcher: async (search) =>
      (await usersApi.getAll(1, 20, { search: search || undefined }, [{ key: 'role', value: Role.Owner }]))?.data
        ?.data ?? [],
    getValue: (u) => u.id,
    getLabel: (u) => u.name,
  });

  const { control, handleSubmit } = useForm<CreateMarketSchema>({
    resolver: zodResolver(createMarketSchema(t)),
    defaultValues: { name: '', address: '', ownerId: '', image: null },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateMarketSchema) => {
      const payload: Record<string, unknown> = { name: data.name, address: data.address, ownerId: data.ownerId };
      if (data.image instanceof File) payload.image = data.image;
      return marketsApi.create(appendToFormData(payload));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['markets'] });
      navigate('/markets');
    },
    onError: () => {},
  });

  function onSubmit(data: CreateMarketSchema) {
    mutate(data);
  }

  return (
    <div className="flex flex-1 flex-col space-y-6 pb-24 md:pb-8">
      <BreadCrumbs
        items={[
          { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
          { label: t('title'), link: '/markets' },
          { label: t('create') },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t('create')}</h1>
        <div className="hidden gap-3 md:flex">
          <Button variant="outline" onClick={() => navigate('/markets')}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" form="create-market-page-form" disabled={isPending}>
            {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            {t('actions.create', { ns: 'common' })}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[3.5fr_6.5fr]">
        <Panel>
          <FormFileInput
            control={control}
            name="image"
            label={t('common:fields.image')}
            accept="image/*"
            variant="dropzone"
            aspectRatio="square"
          />
        </Panel>

        <Panel bodyClassName="p-6">
          <form id="create-market-page-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormInput control={control} name="name" label={t('fields.name')} placeholder={t('fields.name')} required />
            <FormGrid>
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
                options={owners.options}
                onSearch={owners.onSearch}
                loading={owners.loading}
                placeholder={t('fields.ownerId')}
                required
              />
            </FormGrid>
          </form>
        </Panel>
      </div>

      <div
        className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 backdrop-blur md:hidden"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <div className="flex gap-3">
          <Button variant="outline" className="h-9 flex-1" onClick={() => navigate('/markets')}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" form="create-market-page-form" className="h-9 flex-1" disabled={isPending}>
            {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            {t('actions.create', { ns: 'common' })}
          </Button>
        </div>
      </div>
    </div>
  );
}
