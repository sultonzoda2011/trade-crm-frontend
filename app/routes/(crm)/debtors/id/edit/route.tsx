import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { debtorsApi } from '~/api/debtors';
import { DebtorFormFields } from '~/components/debtors/DebtorFormFields';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { EntityFormPage } from '~/components/shared/EntityFormPage';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import { useForm } from '~/hooks/useForm';
import { queryKeys } from '~/lib/query-keys';
import { requestDebtorSchema, type RequestDebtorSchema } from '~/validations/debtor';

export default function EditDebtorPage() {
  const { t } = useTranslation(['debtors', 'common', 'validation']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: queryKeys.detail('debtors', id),
    queryFn: () => debtorsApi.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const { control, handleSubmit, reset } = useForm<RequestDebtorSchema>({
    resolver: zodResolver(requestDebtorSchema(t)),
  });

  const debtor = response?.data;

  useEffect(() => {
    if (!debtor) return;
    reset({ name: debtor.name, phone: debtor.phone });
  }, [debtor, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: (request: RequestDebtorSchema) => debtorsApi.update({ request, id: id! }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.entity('debtors') });
      void queryClient.invalidateQueries({ queryKey: queryKeys.detail('debtors', id) });
      navigate(`/debtors/${id}`);
    },
  });

  if (isLoading) return <ByIdSkeleton />;

  if (!debtor) {
    return (
      <NotFoundBlock
        label={t('notFound')}
        onBack={() => navigate('/debtors')}
        backLabel={t('actions.back', { ns: 'common' })}
      />
    );
  }

  return (
    <EntityFormPage
      formId="edit-debtor-page-form"
      title={t('actions.edit')}
      breadcrumbs={[
        { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
        { label: t('title'), link: '/debtors' },
        { label: debtor.name, link: `/debtors/${id}` },
        { label: t('actions.edit') },
      ]}
      cancelTo={`/debtors/${id}`}
      submitLabel={t('actions.save')}
      isPending={isPending}
      onFormSubmit={handleSubmit((request) => mutate(request))}>
      <DebtorFormFields control={control} t={t} />
    </EntityFormPage>
  );
}
