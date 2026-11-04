import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { profileApi } from '~/api/profile';
import { PasswordChecklist } from '~/components/profile/PasswordChecklist';
import { EntityFormPage } from '~/components/shared/EntityFormPage';
import { FormInput } from '~/components/ui/form/FormInput';
import { useForm } from '~/hooks/useForm';
import { parseApiError } from '~/lib/api-error';
import { queryKeys } from '~/lib/query-keys';
import { showSuccess } from '~/store/useSuccessStore';
import { changePasswordSchema, type ChangePasswordSchema } from '~/validations/profile';

export default function ChangePasswordPage() {
  const { t } = useTranslation(['profile', 'common', 'validation']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reveal, setReveal] = useState(false);

  const schema = useMemo(() => changePasswordSchema(t), [t]);
  const { control, handleSubmit, setError, watch } = useForm<ChangePasswordSchema>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const newPassword = watch('newPassword') ?? '';
  const confirmPassword = watch('confirmPassword') ?? '';
  const inputType = reveal ? 'text' : 'password';

  const { mutate, isPending } = useMutation({
    mutationFn: (data: ChangePasswordSchema) => profileApi.updatePassword(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profileAll() });
      showSuccess({ title: t('passwordSuccess'), description: t('passwordSuccessHint') });
      navigate('/profile');
    },
    onError: (error) => {
      const info = parseApiError(error);
      if (info.isOffline || info.isNetwork) return void toast.error(t('needInternet'));
      switch (info.code) {
        case 'CURRENT_PASSWORD_INCORRECT':
          return setError('currentPassword', { message: t('errors.currentPasswordIncorrect') });
        case 'PASSWORD_SAME_AS_CURRENT':
          return setError('newPassword', { message: t('validation:passwordSame') });
        case 'PASSWORD_MISMATCH':
          return setError('confirmPassword', { message: t('validation:passwordMismatch') });
        default:
          toast.error(t('passwordError'));
      }
    },
  });

  const toggle = (
    <button
      type="button"
      onClick={() => setReveal((v) => !v)}
      aria-label={reveal ? t('hidePassword') : t('showPassword')}
      className="text-muted-foreground -mr-1 flex size-9 items-center justify-center rounded-full active:opacity-60">
      {reveal ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
    </button>
  );

  return (
    <EntityFormPage
      formId="change-password-page-form"
      title={t('sections.password')}
      trail={{ kind: 'profile-sub', title: t('sections.password') }}
      submitLabel={t('actions.savePassword')}
      isPending={isPending}
      onFormSubmit={handleSubmit((data) => mutate(data))}>
      <FormInput
        control={control}
        name="currentPassword"
        type={inputType}
        autoComplete="current-password"
        label={t('fields.currentPassword')}
        placeholder={t('fields.currentPassword')}
        endIcon={toggle}
        required
      />
      <div className="space-y-3">
        <FormInput
          control={control}
          name="newPassword"
          type={inputType}
          autoComplete="new-password"
          label={t('fields.newPassword')}
          placeholder={t('fields.newPassword')}
          required
        />
        <PasswordChecklist value={newPassword} confirm={confirmPassword} />
      </div>
      <FormInput
        control={control}
        name="confirmPassword"
        type={inputType}
        autoComplete="new-password"
        label={t('fields.confirmPassword')}
        placeholder={t('fields.confirmPassword')}
        required
      />
    </EntityFormPage>
  );
}
