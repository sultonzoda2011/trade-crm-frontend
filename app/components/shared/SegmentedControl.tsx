import type { ComponentType } from 'react';
import { cn } from '~/lib/utils';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  icon?: ComponentType<{ className?: string }>;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * Компактный переключатель на 2-3 равнозначных варианта вместо селекта —
 * для полей, которые на практике почти всегда переключаются одним тапом
 * (способ оплаты и т.п.), а не выбираются из длинного списка.
 */
export function SegmentedControl<T extends string>({ options, value, onChange, className }: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      className={cn('bg-muted grid gap-1 rounded-lg p-1', className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((opt) => {
        const selected = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex h-10 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors',
              selected ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}>
            {Icon && <Icon className="size-4" />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
