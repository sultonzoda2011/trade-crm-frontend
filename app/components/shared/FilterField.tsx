import { useTranslation } from 'react-i18next';
import type { ActiveFilter, FilterConfig } from '~/types/filters';
import { CustomInput } from '~/components/shared/CustomInput';
import { Label } from '~/components/ui/label';
import { CustomSelect } from '~/components/shared/CustomSelect';
import { DateInputField } from '~/components/shared/DateInputField';

interface FilterFieldProps {
  field: FilterConfig;
  draft: ActiveFilter[];
  onChange: (key: string, value: any) => void;
}

function getValue(filters: ActiveFilter[], key: string): any {
  return filters.find((f) => f.key === key)?.value ?? '';
}

export function FilterField({ field, draft, onChange }: FilterFieldProps) {
  const { t } = useTranslation('common');

  if (field.type === 'input') {
    return (
      <div className="space-y-1.5">
        <Label>{field.label}</Label>
        <CustomInput
          placeholder={field.placeholder}
          value={getValue(draft, field.key)}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      </div>
    );
  }

  if (field.type === 'select') {
    const options = field.options.map((opt) => ({
      value: String(opt.value),
      label: opt.label,
    }));
    const raw = getValue(draft, field.key);
    const current = raw === '' || raw == null ? null : String(raw);

    return (
      <CustomSelect
        label={field.label}
        placeholder={field.placeholder ?? t('filters.all')}
        options={options}
        value={current}
        onChange={(v) => {
          onChange(field.key, v === null ? '' : Number.isNaN(Number(v)) ? v : Number(v));
        }}
      />
    );
  }

  if (field.type === 'number-range') {
    return (
      <div className="space-y-1.5">
        <Label>{field.label}</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <CustomInput
            type="number"
            placeholder={field.placeholderFrom ?? t('filters.from')}
            value={getValue(draft, field.keyFrom)}
            onChange={(e) => onChange(field.keyFrom, e.target.value)}
          />
          <span className="text-muted-foreground hidden text-sm sm:block">—</span>
          <CustomInput
            type="number"
            placeholder={field.placeholderTo ?? t('filters.to')}
            value={getValue(draft, field.keyTo)}
            onChange={(e) => onChange(field.keyTo, e.target.value)}
          />
        </div>
      </div>
    );
  }

  if (field.type === 'date') {
    return (
      <DateInputField
        label={field.label}
        placeholder={field.placeholder}
        value={getValue(draft, field.key)}
        onChange={(date) => onChange(field.key, date)}
      />
    );
  }

  if (field.type === 'boolean') {
    const raw = getValue(draft, field.key);
    const current = raw === '' || raw == null ? null : String(raw);
    const options = [
      { value: 'true', label: field.trueLabel ?? t('filters.yes') },
      { value: 'false', label: field.falseLabel ?? t('filters.no') },
    ];

    return (
      <CustomSelect
        label={field.label}
        placeholder={t('filters.all')}
        options={options}
        value={current}
        onChange={(v) => onChange(field.key, v === null ? '' : v)}
      />
    );
  }

  if (field.type === 'date-range') {
    return (
      <div className="space-y-1.5">
        <Label>{field.label}</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <DateInputField
            className="flex-1 space-y-0"
            placeholder={field.placeholderFrom ?? t('filters.from')}
            value={getValue(draft, field.keyFrom)}
            onChange={(date) => onChange(field.keyFrom, date)}
          />
          <span className="text-muted-foreground hidden text-sm sm:block">—</span>
          <DateInputField
            className="flex-1 space-y-0"
            placeholder={field.placeholderTo ?? t('filters.to')}
            value={getValue(draft, field.keyTo)}
            onChange={(date) => onChange(field.keyTo, date)}
          />
        </div>
      </div>
    );
  }

  return null;
}
