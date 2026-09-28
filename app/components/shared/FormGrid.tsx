import type { ReactNode } from 'react';
import { cn } from '~/lib/utils';

/**
 * Сетка для пар полей формы. На мобильном (<640px) всегда одна колонка —
 * инпуты в 2-3 колонки на 360px нечитаемы и не проходят по touch-таргету.
 * От sm — раскрывается в две колонки.
 */
export function FormGrid({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2', className)}>{children}</div>;
}
