import { useEffect } from 'react';
import { useForm as useRHForm, type UseFormProps, type FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export function useForm<T extends FieldValues>(options: UseFormProps<T>) {
  const { i18n } = useTranslation();
  const form = useRHForm<T>(options);

  useEffect(() => {
    if (form.formState.isSubmitted) {
      form.trigger();
    }
  }, [i18n.language]);

  return form;
}
