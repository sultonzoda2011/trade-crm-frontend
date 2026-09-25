import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { sellersApi } from '~/api/sellers';
import { Panel } from '~/components/layout/Panel';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { FormGrid } from '~/components/shared/FormGrid';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { useForm } from '~/hooks/useForm';
import { appendToFormData } from '~/lib/form-data';
import { updateSellerSchema, type UpdateSellerSchema } from '~/validations/seller';

export default function EditSellerPage() {
  const { t } = useTranslation(['sellers', 'common', 'validation']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ['seller', id],
    queryFn: () => sellersApi.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const { control, handleSubmit, reset } = useForm<UpdateSellerSchema>({
    resolver: zodResolver(updateSellerSchema(t)),
  });

  const seller = response?.data;

  useEffect(() => {
    if (!seller) return;
    reset({ name: seller.name, email: seller.email, password: '', image: seller.image });
  }, [seller, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: UpdateSellerSchema) => {
      const payload: Record<string, unknown> = { name: data.name, email: data.email };
      if (data.password) payload.password = data.password;
      if (data.image instanceof File) payload.image = data.image;
      return sellersApi.update({ formData: appendToFormData(payload), id: id! });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sellers'] });
      void queryClient.invalidateQueries({ queryKey: ['seller', id] });
      navigate(`/sellers/${id}`);
    },
    onError: () => {},
  });

  function onSubmit(data: UpdateSellerSchema) {
    mutate(data);
  }

  if (isLoading) return <ByIdSkeleton />;

  if (!seller) {
    return (
      <NotFoundBlock
        label={t('notFound')}
        onBack={() => navigate('/sellers')}
        backLabel={t('actions.back', { ns: 'common' })}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col space-y-6 pb-24 md:pb-8">
      <BreadCrumbs
        items={[
          { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
          { label: t('title'), link: '/sellers' },
          { label: seller.name, link: `/sellers/${id}` },
          { label: t('actions.edit', { ns: 'common' }) },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t('actions.edit', { ns: 'common' })}</h1>
        <div className="hidden gap-3 md:flex">
          <Button variant="outline" onClick={() => navigate(`/sellers/${id}`)}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" form="edit-seller-page-form" disabled={isPending}>
            {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            {t('actions.save', { ns: 'common' })}
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
          <form id="edit-seller-page-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                placeholder={t('fields.password')}
              />
            </FormGrid>
          </form>
        </Panel>
      </div>

      <div
        className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 backdrop-blur md:hidden"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <div className="flex gap-3">
          <Button variant="outline" className="h-9 flex-1" onClick={() => navigate(`/sellers/${id}`)}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" form="edit-seller-page-form" className="h-9 flex-1" disabled={isPending}>
            {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            {t('actions.save', { ns: 'common' })}
          </Button>
        </div>
      </div>
    </div>
  );
}
