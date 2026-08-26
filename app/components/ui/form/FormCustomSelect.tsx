import { type Control, Controller, type FieldValues, type Path } from 'react-hook-form';
import { CustomSelect, type CustomSelectOption } from '~/components/shared/CustomSelect';

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
  isMulti?: boolean;
  isClearable?: boolean;
  /** Enable server-side (API) search — forwards each keystroke (see `useAsyncSelectOptions`). */
  onSearch?: (query: string) => void;
  /** Show a loading state while an async search request is in flight. */
  loading?: boolean;
}

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
          <CustomSelect
            {...props}
            isMulti={props.isMulti as any}
            value={field.value ?? (props.isMulti ? [] : null)}
            onChange={field.onChange}
          />
          {fieldState.error && <p className="text-destructive mt-1 text-sm">{fieldState.error.message}</p>}
        </div>
      )}
    />
  );
}
