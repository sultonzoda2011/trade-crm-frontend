import type { ReactNode } from 'react';
import { cn } from '~/lib/utils';

/**
 * Ряд компактных метрик (StatCard или label+value блоки) под карточкой/деталями.
 * Колонки фиксированы на всех ширинах (в т.ч. на самом узком мобильном) — StatCard
 * уже безопасно truncate-ит длинный текст внутри себя (см. min-w-0 + truncate),
 * поэтому нет смысла схлопывать сетку до 2 колонок на мобильном: это только
 * оставляет последнюю карточку одиноко висеть слева с пустотой справа.
 */
export function StatRow({ cols = 3, className, children }: { cols?: 2 | 3; className?: string; children: ReactNode }) {
  return <div className={cn('grid gap-2', cols === 2 ? 'grid-cols-2' : 'grid-cols-3', className)}>{children}</div>;
}
