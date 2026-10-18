import { type Control, Controller, type FieldValues, type Path } from 'react-hook-form';
import type { CustomSelectOption } from '~/components/shared/CustomSelect';
import { PickerField } from '~/components/shared/PickerField';

interface FormCustomSelectProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  options: CustomSelectOption[];
  label?: string;
  placeholder?: string;
  emptyText?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  isClearable?: boolean;
  /** Enable server-side (API) search — forwards each keystroke (see `useAsyncSelectOptions`). */
  onSearch?: (query: string) => void;
  /** Show a loading state while an async search request is in flight. */
  loading?: boolean;
}

/**
 * Поле формы «выбор из списка». Раскрывается шторкой снизу (PickerField), а не выпадающим списком —
 * удобнее с телефона и работает с данными на устройстве без сети.
 */
export function FormCustomSelect<T extends FieldValues>({
  control,
  name,
  className,
  ...props
}: FormCustomSelectProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className={className}>
          <PickerField {...props} value={field.value ?? null} onChange={field.onChange} />
          {fieldState.error && <p className="text-destructive mt-1 text-sm">{fieldState.error.message}</p>}
        </div>
      )}
    />
  );
}
