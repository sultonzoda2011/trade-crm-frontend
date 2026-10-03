import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { sellersApi } from '~/api/sellers';
import { Panel } from '~/components/layout/Panel';
import { FormGrid } from '~/components/shared/FormGrid';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { useForm } from '~/hooks/useForm';
import { appendToFormData } from '~/lib/form-data';
import { queryKeys } from '~/lib/query-keys';
import { createSellerSchema, type CreateSellerSchema } from '~/validations/seller';

export default function CreateSellerPage() {
  const { t } = useTranslation(['sellers', 'common', 'validation']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { control, handleSubmit } = useForm<CreateSellerSchema>({
    resolver: zodResolver(createSellerSchema(t)),
    defaultValues: { name: '', email: '', password: '', image: null },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateSellerSchema) => {
      const payload: Record<string, unknown> = { name: data.name, email: data.email, password: data.password };
      if (data.image instanceof File) payload.image = data.image;
      return sellersApi.create(appendToFormData(payload));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.entity('sellers') });
      navigate('/sellers');
    },
    onError: () => {},
  });

  function onSubmit(data: CreateSellerSchema) {
    mutate(data);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col space-y-5 pb-32 md:max-w-none md:pb-8">
      <BreadCrumbs
        items={[
          { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
          { label: t('title'), link: '/sellers' },
          { label: t('create') },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('create')}</h1>
        <div className="hidden gap-3 md:flex">
          <Button variant="outline" onClick={() => navigate('/sellers')}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" form="create-seller-page-form" disabled={isPending}>
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

        <Panel bodyClassName="p-4 md:p-6">
          <form id="create-seller-page-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormInput
              control={control}
              name="name"
              label={t('fields.fullName')}
              placeholder={t('fields.fullName')}
              required
            />
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
                name="password"
                type="password"
                label={t('fields.password')}
                placeholder="••••••••"
                required
              />
            </FormGrid>
          </form>
        </Panel>
      </div>

      {/* Нижняя панель на телефоне (вкладки на экранах форм скрыты): одна главная кнопка на всю ширину. */}
      <div
        className="bg-card border-border fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 md:hidden"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <Button type="submit" form="create-seller-page-form" size="lg" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          {t('actions.create', { ns: 'common' })}
        </Button>
      </div>
    </div>
  );
}
