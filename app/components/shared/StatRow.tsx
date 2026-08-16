import type { ReactNode } from 'react';
import { cn } from '~/lib/utils';

/**
 * Ряд компактных метрик (StatCard или label+value блоки) под карточкой/деталями.
 * cols=2: 2 колонки всегда (короткие пары помещаются даже на 360px).
 * cols=3: на мобильном схлопывается до 2 колонок (3-я уезжает во вторую строку),
 * от sm — полные 3 колонки. Фикс для markets/id, my-market, PaymentDistributionChart,
 * где раньше был жёсткий grid-cols-3 без учёта мобильной ширины.
 */
export function StatRow({ cols = 3, className, children }: { cols?: 2 | 3; className?: string; children: ReactNode }) {
  return (
    <div className={cn('grid gap-2', cols === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3', className)}>
      {children}
    </div>
  );
}
