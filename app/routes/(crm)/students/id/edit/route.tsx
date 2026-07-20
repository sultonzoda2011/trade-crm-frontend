import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { studentsApi } from '~/api/students';
import { Panel } from '~/components/layout/Panel';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { FormCustomSelect } from '~/components/ui/form/FormCustomSelect';
import { FormDateInput } from '~/components/ui/form/FormDateInput';
import { FormFileInput } from '~/components/ui/form/FormFileInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { Skeleton } from '~/components/ui/skeleton';
import { getActiveStatusOptions, getGenderOptions } from '~/config/enumOptions';
import { useForm } from '~/hooks/useForm';
import { toDayjs } from '~/lib/date';
import { appendToFormData } from '~/lib/form-data';
import { updateStudentSchema, type UpdateStudentSchema } from '~/validations/student';

export default function EditStudentPage() {
  const { t } = useTranslation(['students', 'common', 'validation']);
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const studentId = Number(id);
  const queryClient = useQueryClient();

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const { data: response, isLoading } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => studentsApi.getById(studentId),
    enabled: !!studentId,
    staleTime: 30_000,
  });

  const student = response?.data;

  // ── Form ───────────────────────────────────────────────────────────────────

  const { control, handleSubmit, reset } = useForm<UpdateStudentSchema>({
    resolver: zodResolver(updateStudentSchema(t)),
  });

  useEffect(() => {
    if (!student) return;
    reset({
      fullName: student.fullName,
      email: student.email,
      phoneNumber: student.phone,
      address: student.address,
      birthday: toDayjs(student.birthday)?.format('YYYY-MM-DD') ?? null,
      gender: student.gender,
      activeStatus: student.activeStatus,
      profilePhoto: import.meta.env.VITE_API_URL ? student.imagePath : undefined,
      documentFile: import.meta.env.VITE_API_URL ? student.document : undefined,
    });
  }, [student, reset]);

  // ── Mutation ───────────────────────────────────────────────────────────────

  const { mutate, isPending } = useMutation({
    mutationFn: (formData: FormData) => studentsApi.update(studentId, formData),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['students'] });
      void queryClient.invalidateQueries({ queryKey: ['student', studentId] });
      toast.success(t('updateSuccess'));
      navigate('/students');
    },
    onError: () => {
      toast.error(t('updateError'));
    },
  });

  function onSubmit(data: UpdateStudentSchema) {
    const payload = {
      ...data,
      // Отправляем файлы только если это новый File, иначе пропускаем
      profilePhoto: data.profilePhoto instanceof File ? data.profilePhoto : undefined,
      documentFile: data.documentFile instanceof File ? data.documentFile : undefined,
    };
    mutate(appendToFormData(payload as Record<string, unknown>));
  }

  // ── Select options ─────────────────────────────────────────────────────────

  const genderOptions = getGenderOptions(t);
  const activeStatusOptions = getActiveStatusOptions(t);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 space-y-4">
      <BreadCrumbs
        items={[
          { label: t('navigation.dashboard'), link: '/' },
          { link: location.state?.fromPath || '/students', label: location.state?.fromName || t('title') },
          { link: `/students/${studentId}`, label: student?.fullName || '...' },
          { label: t('actions.edit') },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{t('edit')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" form="edit-student-form" disabled={isPending || isLoading}>
            {t('actions.save')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <EditSkeleton />
      ) : (
        <form id="edit-student-form" onSubmit={handleSubmit(onSubmit)}>
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
                  <FormCustomSelect
                    control={control}
                    name="activeStatus"
                    label={t('fields.status')}
                    options={activeStatusOptions}
                    placeholder={t('filters.all')}
                  />
                </div>
              </Panel>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

function EditSkeleton() {
  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4">
        <Panel>
          <Skeleton className="aspect-square w-full rounded-xl" />
        </Panel>
        <Panel>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </Panel>
      </div>
      <div className="lg:col-span-2">
        <Panel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
