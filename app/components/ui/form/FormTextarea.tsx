import { type Control, Controller, type FieldValues, type Path } from 'react-hook-form';
import { FormFieldWrapper } from '~/components/ui/form/FormFieldWrapper';
import { Textarea } from '~/components/ui/textarea';

interface FormTextareaProps<T extends FieldValues> extends React.ComponentProps<'textarea'> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  fieldClassName?: string;
}

export function FormTextarea<T extends FieldValues>({
  control,
  name,
  label,
  required,
  className,
  fieldClassName,
  ...textareaProps
}: FormTextareaProps<T>) {
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
          className={className}
          labelClassName="mt-3">
          <Textarea
            id={name}
            aria-invalid={!!fieldState.error}
            className={fieldClassName}
            {...textareaProps}
            {...field}
            value={field.value ?? ''}
          />
        </FormFieldWrapper>
      )}
    />
  );
}
