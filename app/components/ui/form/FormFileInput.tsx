import { type Control, Controller, type FieldValues, type Path } from 'react-hook-form';
import { FileInputField } from '../../shared/FileInputField';

import { type FileInputFieldProps } from '../../shared/FileInputField';

export interface FormFileInputProps<T extends FieldValues> extends Omit<
  FileInputFieldProps,
  'value' | 'onChange' | 'onBlur' | 'error' | 'accept' | 'aspectRatio'
> {
  control: Control<T>;
  name: Path<T>;
  accept?: string;
  aspectRatio?: 'video' | 'square';
  variant?: 'dropzone' | 'simple';
  size?: 'default' | 'compact';
}

export function FormFileInput<T extends FieldValues>({
  control,
  name,
  accept = 'image/*',
  aspectRatio = 'video',
  variant = 'dropzone',
  size = 'default',
  ...fieldProps
}: FormFileInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FileInputField
          value={field.value as File | string | null | undefined}
          onChange={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
          accept={accept}
          aspectRatio={aspectRatio}
          variant={variant}
          size={size}
          {...fieldProps}
        />
      )}
    />
  );
}
