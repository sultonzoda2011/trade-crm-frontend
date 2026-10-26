import type { TFunction } from 'i18next';
import type { Control } from 'react-hook-form';
import { FormGrid } from '~/components/shared/FormGrid';
import { FormInput } from '~/components/ui/form/FormInput';
import type { RequestDebtorSchema } from '~/validations/debtor';

interface DebtorFormFieldsProps {
  control: Control<RequestDebtorSchema>;
  t: TFunction;
  /** Render in a 2-column grid (full pages) or stacked (modals). */
  grid?: boolean;
}

/**
 * Общие поля должника (имя + телефон) для страниц создания/редактирования и модалки.
 */
export function DebtorFormFields({ control, t, grid = true }: DebtorFormFieldsProps) {
  const fields = (
    <>
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
    </>
  );

  return grid ? <FormGrid>{fields}</FormGrid> : fields;
}
