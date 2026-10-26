import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { marketsApi } from '~/api/markets';
import { usersApi } from '~/api/users';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { EntityFormPage } from '~/components/shared/EntityFormPage';
import { FormGrid } from '~/components/shared/FormGrid';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import { FormCustomSelect } from '~/components/ui/form/FormCustomSelect';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { Action } from '~/config/actions';
import { useAsyncSelectOptions } from '~/hooks/useAsyncSelectOptions';
import { useCan } from '~/hooks/useCan';
import { useEntityForm } from '~/hooks/useEntityForm';
import { useForm } from '~/hooks/useForm';
import { queryKeys } from '~/lib/query-keys';
import { Role } from '~/types/common';
import type { Market } from '~/types/markets';
import { updateMarketSchema, type UpdateMarketSchema } from '~/validations/market';

export default function EditMarketPage() {
  const { t } = useTranslation(['markets', 'common', 'validation']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = useCan();
  const canManageUsers = can(Action.USERS_VIEW);

  const { control, handleSubmit, reset } = useForm<UpdateMarketSchema>({
    resolver: zodResolver(updateMarketSchema(t)),
  });

  const {
    detail: market,
    isLoading,
    submit,
    isPending,
  } = useEntityForm<UpdateMarketSchema, Market>({
    entity: 'markets',
    id,
    fetcher: (marketId) => marketsApi.getById(marketId),
    api: marketsApi,
    toForm: (loaded) => ({
      name: loaded.name,
      address: loaded.address,
      ownerId: loaded.owner.id,
      image: loaded.image,
    }),
    toPayload: (data) => ({ name: data.name, address: data.address, ownerId: data.ownerId, image: data.image }),
    reset,
    redirectTo: (marketId) => `/markets/${marketId}`,
  });

  const ownerSeed = useMemo(
    () => (market?.owner ? [{ id: market.owner.id, name: market.owner.name }] : undefined),
    [market?.owner]
  );

  const owners = useAsyncSelectOptions({
    queryKey: queryKeys.options('users', { scope: 'owners', limit: 20 }),
    fetcher: async (search) =>
      (
        (await usersApi.getAll(1, 20, { search: search || undefined }, [{ key: 'role', value: Role.Owner }]))?.data
          ?.data ?? []
      ).map((u) => ({ id: u.id, name: u.name })),
    getValue: (u) => u.id,
    getLabel: (u) => u.name,
    // Без сети список собирается из сохранённых пользователей — оставляем только владельцев.
    accept: (u) => !('role' in u) || (u as { role?: string }).role === Role.Owner,
    enabled: canManageUsers,
    seed: ownerSeed,
  });

  if (isLoading) return <ByIdSkeleton />;

  if (!market) {
    return (
      <NotFoundBlock
        label={t('notFound')}
        onBack={() => navigate('/markets')}
        backLabel={t('actions.back', { ns: 'common' })}
      />
    );
  }

  return (
    <EntityFormPage
      formId="edit-market-page-form"
      title={t('actions.edit', { ns: 'common' })}
      breadcrumbs={[
        { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
        { label: t('title'), link: '/markets' },
        { label: market.name, link: `/markets/${id}` },
        { label: t('actions.edit', { ns: 'common' }) },
      ]}
      cancelTo={`/markets/${id}`}
      submitLabel={t('actions.save', { ns: 'common' })}
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
      </FormGrid>
    </EntityFormPage>
  );
}
