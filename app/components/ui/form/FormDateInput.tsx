import { type Control, Controller, type FieldValues, type Path } from 'react-hook-form';
import { DateInputField, type DateInputFieldProps } from '../../shared/DateInputField';

interface FormDateInputProps<T extends FieldValues> extends Omit<
  DateInputFieldProps,
  'value' | 'onChange' | 'onBlur' | 'error'
> {
  control: Control<T>;
  name: Path<T>;
}

export function FormDateInput<T extends FieldValues>({ control, name, ...fieldProps }: FormDateInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <DateInputField
          value={field.value as Date | string | null | undefined}
          onChange={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
          {...fieldProps}
        />
      )}
    />
  );
}
