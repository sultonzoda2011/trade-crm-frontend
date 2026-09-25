import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { debtorsApi } from '~/api/debtors';
import { Panel } from '~/components/layout/Panel';
import { FormGrid } from '~/components/shared/FormGrid';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { FormInput } from '~/components/ui/form/FormInput';
import { useForm } from '~/hooks/useForm';
import { requestDebtorSchema, type RequestDebtorSchema } from '~/validations/debtor';

export default function CreateDebtorPage() {
  const { t } = useTranslation(['debtors', 'common', 'validation']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { control, handleSubmit } = useForm<RequestDebtorSchema>({
    resolver: zodResolver(requestDebtorSchema(t)),
    defaultValues: { name: '', phone: '' },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: debtorsApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['debtors'] });
      navigate('/debtors');
    },
    onError: () => {},
  });

  function onSubmit(request: RequestDebtorSchema) {
    mutate(request);
  }

  return (
    <div className="flex flex-1 flex-col space-y-6 pb-24 md:pb-8">
      <BreadCrumbs
        items={[
          { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
          { label: t('title'), link: '/debtors' },
          { label: t('actions.create') },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t('actions.create')}</h1>
        <div className="hidden gap-3 md:flex">
          <Button variant="outline" onClick={() => navigate('/debtors')}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" form="create-debtor-page-form" disabled={isPending}>
            {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            {t('actions.save')}
          </Button>
        </div>
      </div>

      <Panel bodyClassName="p-6" className="max-w-xl">
        <form id="create-debtor-page-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormGrid>
            <FormInput
              control={control}
              name="name"
              label={t('fields.fullName')}
              placeholder={t('fields.fullName')}
              required
            />
            <FormInput
              control={control}
              name="phone"
              type="tel"
              inputMode="tel"
              label={t('fields.phone')}
              placeholder={t('fields.phone')}
              required
            />
          </FormGrid>
        </form>
      </Panel>

      <div
        className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 backdrop-blur md:hidden"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <div className="flex gap-3">
          <Button variant="outline" className="h-9 flex-1" onClick={() => navigate('/debtors')}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" form="create-debtor-page-form" className="h-9 flex-1" disabled={isPending}>
            {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            {t('actions.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
