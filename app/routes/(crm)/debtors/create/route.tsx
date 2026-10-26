import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { DebtorFormFields } from '~/components/debtors/DebtorFormFields';
import { EntityFormPage } from '~/components/shared/EntityFormPage';
import { useCreateDebtor } from '~/hooks/useCreateDebtor';
import { useForm } from '~/hooks/useForm';
import { requestDebtorSchema, type RequestDebtorSchema } from '~/validations/debtor';

export default function CreateDebtorPage() {
  const { t } = useTranslation(['debtors', 'common', 'validation']);
  const navigate = useNavigate();

  const { control, handleSubmit } = useForm<RequestDebtorSchema>({
    resolver: zodResolver(requestDebtorSchema(t)),
    defaultValues: { name: '', phone: '' },
  });

  const { create, isSubmitting: isPending } = useCreateDebtor();

  // Форма не ждёт сервера: на слабой связи или без сети человек сразу попадает в список,
  // где новый должник уже виден с меткой «в очереди».
  function onSubmit(request: RequestDebtorSchema) {
    create(request, () => navigate('/debtors'));
  }

  return (
    <EntityFormPage
      formId="create-debtor-page-form"
      title={t('create')}
      breadcrumbs={[
        { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
        { label: t('title'), link: '/debtors' },
        { label: t('create') },
      ]}
      cancelTo="/debtors"
      submitLabel={t('actions.save')}
      isPending={isPending}
      onFormSubmit={handleSubmit(onSubmit)}>
      <DebtorFormFields control={control} t={t} />
    </EntityFormPage>
  );
}
