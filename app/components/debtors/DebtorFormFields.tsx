import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { TFunction } from 'i18next';
import type { Control } from 'react-hook-form';
import { FormGrid } from '~/components/shared/FormGrid';
import { FormInput } from '~/components/ui/form/FormInput';
import { FormTextarea } from '~/components/ui/form/FormTextarea';
import { cn } from '~/lib/utils';
import type { RequestDebtorSchema } from '~/validations/debtor';

interface DebtorFormFieldsProps {
  control: Control<RequestDebtorSchema>;
  t: TFunction;
  /** Render in a 2-column grid (full pages) or stacked (modals). */
  grid?: boolean;
  /** Раскрыть блок «Дополнительно» сразу — при правке, когда в нём уже есть значения. */
  defaultExpanded?: boolean;
}

/**
 * Общие поля должника для страниц создания/редактирования и модалки: имя и телефон — всегда,
 * заметка, лимит долга и срок по умолчанию — в сворачиваемом блоке, чтобы быстрое
 * создание оставалось из двух полей.
 */
export function DebtorFormFields({ control, t, grid = true, defaultExpanded = false }: DebtorFormFieldsProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const main = (
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

  const extra = (
    <>
      <FormTextarea
        control={control}
        name="note"
        label={t('fields.note')}
        placeholder={t('fields.notePlaceholder')}
        maxLength={500}
      />
      <FormInput
        control={control}
        name="creditLimit"
        type="number"
        inputMode="decimal"
        label={t('fields.creditLimit')}
        placeholder={t('fields.creditLimitPlaceholder')}
      />
      <FormInput
        control={control}
        name="defaultDueDays"
        type="number"
        inputMode="numeric"
        label={t('fields.defaultDueDays')}
        placeholder={t('fields.defaultDueDaysPlaceholder')}
      />
    </>
  );

  return (
    <div className="space-y-3">
      {grid ? <FormGrid>{main}</FormGrid> : main}

      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        className="text-primary flex min-h-11 items-center gap-1.5 px-1 text-base font-medium active:opacity-60">
        {t('fields.moreOptions')}
        <ChevronDown className={cn('size-5 transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (grid ? <FormGrid>{extra}</FormGrid> : extra)}
    </div>
  );
}
