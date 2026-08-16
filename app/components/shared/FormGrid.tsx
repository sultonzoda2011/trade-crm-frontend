import type { ReactNode } from 'react';
import { cn } from '~/lib/utils';

/**
 * Сетка для пар/троек полей формы. На мобильном (<640px) всегда одна колонка —
 * инпуты в 2-3 колонки на 360px нечитаемы и не проходят по touch-таргету.
 * От sm — раскрывается в cols колонок.
 *
 * Раньше по формам (products/create, products/id/edit, transactions/id, profile,
 * markets/id, my-market) было разбросано голое `grid grid-cols-2` / `grid-cols-3`
 * без адаптива — заменяется этим компонентом.
 */
export function FormGrid({
  cols = 2,
  className,
  children,
}: {
  cols?: 2 | 3;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn('grid grid-cols-1 gap-3', cols === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3', className)}>
      {children}
    </div>
  );
}
