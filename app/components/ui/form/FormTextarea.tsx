import { type Control, Controller, type FieldValues, type Path } from 'react-hook-form';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';
import { cn } from '~/lib/utils';

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
        <div className={cn('space-y-1.5', className)}>
          {label && (
            <Label className="mt-3" htmlFor={name}>
              {label}
              {required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
          )}
          <Textarea
            id={name}
            aria-invalid={!!fieldState.error}
            className={fieldClassName}
            {...textareaProps}
            {...field}
            value={field.value ?? ''}
          />
          {fieldState.error && <p className="text-destructive text-sm">{fieldState.error.message}</p>}
        </div>
      )}
    />
  );
}
