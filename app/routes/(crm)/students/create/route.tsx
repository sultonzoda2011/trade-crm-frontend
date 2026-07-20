import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { studentsApi } from '~/api/students';
import { Panel } from '~/components/layout/Panel';
import { getGenderOptions } from '~/config/enumOptions';
import { appendToFormData } from '~/lib/form-data';
import { FormDateInput } from '~/components/ui/form/FormDateInput';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { FormCustomSelect } from '~/components/ui/form/FormCustomSelect';
import { Button } from '~/components/ui/button';
import { useForm } from '~/hooks/useForm';
import { createStudentSchema, type CreateStudentSchema } from '~/validations/student';
import BreadCrumbs from '~/components/ui/bread-crumb';

export default function CreateStudentPage() {
  const { t } = useTranslation(['students', 'common', 'validation']);
  const navigate = useNavigate();
  const location = useLocation();

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: studentsApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success(t('createSuccess'));
      navigate('/students');
    },
    onError: () => {
      toast.error(t('createError'));
    },
  });

  const { control, handleSubmit } = useForm<CreateStudentSchema>({
    resolver: zodResolver(createStudentSchema(t)),
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      address: '',
      birthday: null,
      gender: null,
      profilePhoto: null,
      documentFile: null,
    },
  });

  const genderOptions = getGenderOptions(t);

  function onSubmit(data: CreateStudentSchema) {
    mutate(appendToFormData(data as Record<string, unknown>));
  }

  return (
    <div className="flex-1 space-y-4">
      <BreadCrumbs
        items={[
          { label: t('navigation.dashboard'), link: '/' },
          { link: location.state?.fromPath || '/students', label: location.state?.fromName || t('title') },
          { label: t('create') },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{t('create')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" form="create-student-form" disabled={isPending}>
            {t('actions.create')}
          </Button>
        </div>
      </div>

      <form id="create-student-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          {/* Sidebar: photo + document */}
          <div className="flex flex-col gap-4">
            <Panel>
              <FormFileInput
                control={control}
                name="profilePhoto"
                label={t('profilePhoto')}
                accept="image/*"
                aspectRatio="square"
              />
            </Panel>
            <Panel>
              <FormFileInput
                control={control}
                name="documentFile"
                label={t('documentFile')}
                accept=".pdf,.doc,.docx"
                variant="simple"
              />
            </Panel>
          </div>

          {/* Main fields */}
          <div className="lg:col-span-2">
            <Panel>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormInput
                  control={control}
                  name="fullName"
                  label={t('fields.fullName')}
                  placeholder={t('fields.fullName')}
                  required
                />
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
                  name="phoneNumber"
                  label={t('fields.phone')}
                  placeholder="+992 00 000 00 00"
                  required
                />
                <FormInput
                  control={control}
                  name="address"
                  label={t('fields.address')}
                  placeholder={t('fields.address')}
                />
                <FormDateInput
                  control={control}
                  name="birthday"
                  label={t('fields.birthday')}
                  placeholder={t('common.datePlaceholder')}
                  maxDate={new Date()}
                />
                <FormCustomSelect
                  control={control}
                  name="gender"
                  label={t('fields.gender')}
                  options={genderOptions}
                  placeholder={t('filters.all')}
                />
              </div>
            </Panel>
          </div>
        </div>
      </form>
    </div>
  );
}
