import type { ReactNode } from 'react';
import { cn } from '~/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * Единый заголовок страницы. Раньше в разных местах заголовок дублировался
 * вручную с расходящимися классами (`font-bold` на дашборде против
 * `font-semibold tracking-tight` в списках) — из-за этого один и тот же
 * уровень иерархии выглядел по-разному от страницы к странице.
 */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <div className="text-muted-foreground mt-0.5 text-xs">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
