import { type Control, Controller, type FieldValues, type Path } from 'react-hook-form';
import { CustomInput, type CustomInputProps } from '~/components/shared/CustomInput';
import { FormFieldWrapper } from '~/components/ui/form/FormFieldWrapper';
import { cn } from '~/lib/utils';

interface FormInputProps<T extends FieldValues> extends CustomInputProps {
  control: Control<T>;
  name: Path<T>;
  label?: string;
}

export function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  required,
  className,
  startIcon,
  endIcon,
  type,
  ...inputProps
}: FormInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormFieldWrapper
          htmlFor={name}
          label={label}
          required={required}
          error={fieldState.error?.message}
          className={cn('px-1', className)}>
          <CustomInput
            id={name}
            type={type}
            aria-invalid={!!fieldState.error}
            startIcon={startIcon}
            endIcon={endIcon}
            {...inputProps}
            {...field}
            value={field.value ?? ''}
            onChange={(e) => {
              if (type === 'number') {
                const val = e.target.value;
                field.onChange(val === '' ? '' : Number(val));
              } else {
                field.onChange(e);
              }
            }}
          />
        </FormFieldWrapper>
      )}
    />
  );
}
