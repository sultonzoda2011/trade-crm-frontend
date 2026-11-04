import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Dices, Eye, EyeOff } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { marketsApi } from '~/api/markets';
import { sellersApi } from '~/api/sellers';
import { EntityFormPage } from '~/components/shared/EntityFormPage';
import { FormGrid } from '~/components/shared/FormGrid';
import { FormCustomSelect } from '~/components/ui/form/FormCustomSelect';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { useEntityForm } from '~/hooks/useEntityForm';
import { useForm } from '~/hooks/useForm';
import { getClientUser } from '~/lib/auth-utils';
import { mapToOptions } from '~/lib/mapToOptions';
import { generatePassword } from '~/lib/password-rules';
import { queryKeys } from '~/lib/query-keys';
import { Role } from '~/types/common';
import { createSellerSchema, type CreateSellerSchema } from '~/validations/seller';

export default function CreateSellerPage() {
  const { t } = useTranslation(['sellers', 'common', 'validation']);

  const [showPassword, setShowPassword] = useState(false);
  // У владельца продавец всегда падает в его рынок; администратор выбирает рынок сам.
  const isAdmin = getClientUser()?.role === Role.Admin;

  const { control, handleSubmit, setValue } = useForm<CreateSellerSchema>({
    resolver: zodResolver(createSellerSchema(t, isAdmin)),
    defaultValues: { name: '', email: '', phone: '', password: '', marketId: '', image: null },
  });

  const { data: marketsResponse } = useQuery({
    queryKey: queryKeys.options('markets', { scope: 'seller-form', limit: 100 }),
    queryFn: () => marketsApi.getAll(1, 100, {}, []),
    enabled: isAdmin,
  });
  const marketOptions = useMemo(() => mapToOptions(marketsResponse?.data?.data ?? [], 'id', 'name'), [marketsResponse]);

  const fillPassword = () => {
    setValue('password', generatePassword(), { shouldValidate: true });
    // Сгенерированный пароль надо увидеть и передать продавцу.
    setShowPassword(true);
  };

  const { submit, isPending } = useEntityForm<CreateSellerSchema, unknown>({
    entity: 'sellers',
    api: sellersApi,
    toPayload: (data) => ({
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      password: data.password,
      marketId: isAdmin ? data.marketId : undefined,
      image: data.image,
    }),
    redirectTo: () => '/sellers',
  });

  return (
    <EntityFormPage
      formId="create-seller-page-form"
      title={t('create')}
      trail={{ kind: 'create', section: 'sellers', title: t('create') }}
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
      <FormInput
        control={control}
        name="name"
        label={t('fields.fullName')}
        placeholder={t('fields.fullName')}
        required
      />
      {isAdmin && (
        <FormCustomSelect
          control={control}
          name="marketId"
          label={t('fields.market')}
          options={marketOptions}
          placeholder={t('fields.market')}
          required
        />
      )}
      <FormGrid>
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
          name="phone"
          type="tel"
          inputMode="tel"
          label={t('fields.phone', { ns: 'common' })}
          placeholder="+992 900 12-34-56"
        />
      </FormGrid>
      <FormInput
        control={control}
        name="password"
        type={showPassword ? 'text' : 'password'}
        autoComplete="new-password"
        endIcon={
          <span className="flex items-center gap-2">
            <button type="button" aria-label={t('form.generatePassword')} onClick={fillPassword}>
              <Dices className="size-4" />
            </button>
            <button
              type="button"
              aria-label={showPassword ? t('form.hidePassword') : t('form.showPassword')}
              onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </span>
        }
        label={t('fields.password')}
        placeholder="••••••••"
        required
      />
      <p className="text-muted-foreground -mt-1 px-1 text-xs">{t('form.passwordHint')}</p>
    </EntityFormPage>
  );
}
