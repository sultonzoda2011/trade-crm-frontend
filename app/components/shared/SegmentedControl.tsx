import type { ComponentType } from 'react';
import { haptic } from '~/lib/haptics';
import { cn } from '~/lib/utils';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  /** Подпись для скринридера, когда `label` пустой (вариант показан только значком). */
  ariaLabel?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  /**
   * `default` (44px, h-11) — отдельный выбор на весь тап-таргет (способ оплаты и т.п.).
   * `sm` (32px, h-8) — инлайн-контрол внутри строки настроек (ListRow), как трейлинг-элемент
   * рядом с текстом, а не самостоятельная область — на весь h-11 там выглядит разбухшим
   * относительно настоящего iOS (там такой переключатель в Settings компактный).
   */
  size?: 'default' | 'sm';
}

/**
 * Компактный переключатель на 2-3 равнозначных варианта вместо селекта —
 * для полей, которые на практике почти всегда переключаются одним тапом
 * (способ оплаты и т.п.), а не выбираются из длинного списка.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'default',
}: SegmentedControlProps<T>) {
  const sm = size === 'sm';
  return (
    <div
      role="radiogroup"
      className={cn('bg-muted grid gap-0.5', sm ? 'rounded-lg p-0.5' : 'rounded-[10px] p-0.5', className)}
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
            aria-label={opt.ariaLabel}
            onClick={() => {
              if (!selected) haptic('selection');
              onChange(opt.value);
            }}
            className={cn(
              'flex items-center justify-center rounded-md font-semibold transition-colors',
              sm ? 'h-8 gap-1 text-xs' : 'h-11 gap-1.5 rounded-lg text-sm md:h-9',
              selected ? 'bg-card text-foreground shadow-sm dark:bg-white/20' : 'text-muted-foreground hover:text-foreground'
            )}>
            {Icon && <Icon className={sm ? 'size-3.5' : 'size-4'} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
