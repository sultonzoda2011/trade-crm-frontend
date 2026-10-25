import { useId, type ReactNode } from 'react';
import { haptic } from '~/lib/haptics';
import { cn } from '~/lib/utils';
import type { ActiveFilter } from '~/types/filters';

/** Ряд чипсов переносится на новую строку, а не уходит за край экрана — всё нужное видно сразу. */
export const FILTER_CHIP_ROW = 'flex flex-wrap gap-2';

/** Текущее значение фильтра по ключу; пустое и отсутствующее приводятся к `undefined`. */
export function getFilterValue(filters: ActiveFilter[], key: string): string | undefined {
  const v = filters.find((f) => f.key === key)?.value;
  return v == null || v === '' ? undefined : String(v);
}

export function FilterChip({
  active,
  onClick,
  disabled = false,
  children,
}: {
  active: boolean;
  onClick: () => void;
  /** Сочетание с уже выбранными фильтрами невозможно (см. `~/lib/filter-rules`). */
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={() => {
        haptic('selection');
        onClick();
      }}
      className={cn(
        'h-10 shrink-0 touch-manipulation rounded-full px-4 text-sm font-medium whitespace-nowrap transition-[background-color,color,transform] duration-200 select-none [-webkit-tap-highlight-color:transparent] active:scale-95 md:h-9',
        active ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground active:bg-muted',
        'disabled:text-muted-foreground disabled:pointer-events-none disabled:line-through disabled:opacity-45'
      )}>
      {children}
    </button>
  );
}

/** Подпись над рядом чипсов: без неё непонятно, к какому фильтру относится ряд. */
export function FilterChipGroup({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className="space-y-1.5">
      <p id={id} className="text-muted-foreground px-1 text-xs font-medium">
        {label}
      </p>
      <div className={FILTER_CHIP_ROW}>{children}</div>
    </div>
  );
}
