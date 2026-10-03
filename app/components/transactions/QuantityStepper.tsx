import { Minus, Plus } from 'lucide-react';
import { type Control, Controller, type FieldValues, type Path } from 'react-hook-form';
import { cn } from '~/lib/utils';

interface QuantityStepperProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  className?: string;
}

/**
 * Количество: крупные − и + по бокам и цифра по центру. Большинство позиций —
 * 1–3 штуки, поэтому «+» быстрее клавиатуры; нужное большое число по-прежнему
 * вводится руками. Меньше 1 не опускается (правило схемы — целое от 1).
 */
export function QuantityStepper<T extends FieldValues>({ control, name, className }: QuantityStepperProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value = Number(field.value) || 0;
        return (
          <div
            className={cn(
              'bg-muted inline-flex h-11 items-center rounded-[10px]',
              fieldState.error && 'ring-destructive/50 ring-2',
              className
            )}>
            <button
              type="button"
              aria-label="−"
              disabled={value <= 1}
              onClick={() => field.onChange(Math.max(1, value - 1))}
              className="flex h-full w-11 items-center justify-center rounded-[10px] active:bg-black/10 disabled:opacity-30">
              <Minus className="size-5" strokeWidth={2.25} />
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
              onBlur={field.onBlur}
              className="h-full w-14 [appearance:textfield] bg-transparent text-center text-lg font-semibold outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="button"
              aria-label="+"
              onClick={() => field.onChange(value + 1)}
              className="flex h-full w-11 items-center justify-center rounded-[10px] active:bg-black/10">
              <Plus className="size-5" strokeWidth={2.25} />
            </button>
          </div>
        );
      }}
    />
  );
}
