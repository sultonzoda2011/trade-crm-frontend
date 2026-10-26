import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { marketsApi } from '~/api/markets';
import { usersApi } from '~/api/users';
import { EntityFormPage } from '~/components/shared/EntityFormPage';
import { FormGrid } from '~/components/shared/FormGrid';
import { FormCustomSelect } from '~/components/ui/form/FormCustomSelect';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { useAsyncSelectOptions } from '~/hooks/useAsyncSelectOptions';
import { useEntityForm } from '~/hooks/useEntityForm';
import { useForm } from '~/hooks/useForm';
import { queryKeys } from '~/lib/query-keys';
import { Role } from '~/types/common';
import { createMarketSchema, type CreateMarketSchema } from '~/validations/market';

export default function CreateMarketPage() {
  const { t } = useTranslation(['markets', 'common', 'validation']);

  const owners = useAsyncSelectOptions({
    queryKey: queryKeys.options('users', { scope: 'owners', limit: 20 }),
    fetcher: async (search) =>
      (await usersApi.getAll(1, 20, { search: search || undefined }, [{ key: 'role', value: Role.Owner }]))?.data
        ?.data ?? [],
    getValue: (u) => u.id,
    getLabel: (u) => u.name,
    // Без сети список собирается из сохранённых пользователей — оставляем только владельцев.
    accept: (u) => !('role' in u) || (u as { role?: string }).role === Role.Owner,
  });

  const { control, handleSubmit } = useForm<CreateMarketSchema>({
    resolver: zodResolver(createMarketSchema(t)),
    defaultValues: { name: '', address: '', ownerId: '', image: null },
  });

  const { submit, isPending } = useEntityForm<CreateMarketSchema, unknown>({
    entity: 'markets',
    api: marketsApi,
    toPayload: (data) => ({ name: data.name, address: data.address, ownerId: data.ownerId, image: data.image }),
    redirectTo: () => '/markets',
  });

  return (
    <EntityFormPage
      formId="create-market-page-form"
      title={t('create')}
      breadcrumbs={[
        { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
        { label: t('title'), link: '/markets' },
        { label: t('create') },
      ]}
      cancelTo="/markets"
      submitLabel={t('actions.create', { ns: 'common' })}
      isPending={isPending}
      onFormSubmit={handleSubmit(submit)}
      imageField={
        <FormFileInput
          control={control}
          name="image"
          label={t('common:fields.image')}
          accept="image/*"
          variant="dropzone"
          aspectRatio="square"
        />
      }>
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
    </EntityFormPage>
  );
}
