import { type Control, Controller, type FieldValues, type Path } from 'react-hook-form';
import { ColorSwatches } from '~/components/categories/ColorSwatches';

/** Поле формы «цвет категории» (react-hook-form). */
export function FormColorSwatches<T extends FieldValues>({
  control,
  name,
  label,
}: {
  control: Control<T>;
  name: Path<T>;
  label?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => <ColorSwatches value={field.value} onChange={field.onChange} label={label} />}
    />
  );
}
