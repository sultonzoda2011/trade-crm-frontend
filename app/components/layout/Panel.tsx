import type { ComponentProps, ReactNode } from 'react';
import { cn } from '~/lib/utils';

interface PanelProps extends ComponentProps<'div'> {
  children: ReactNode;
  /**
   * Классы ВНЕШНЕЙ карточки — то, как панель ведёт себя в родительской сетке:
   * `lg:col-span-2`, `flex`, внешние отступы, доп. рамка/фон.
   *
   * Раньше `className` уезжал только во внутренний контейнер контента, а внешний
   * div собирался жёсткой строкой без него — из-за этого любой layout-класс молча
   * терялся. Так, например, `lg:col-span-2` у «Сводки по складу» и `col-span-2`
   * у графика выручки не применялись, и панели занимали одну колонку из трёх.
   */
  className?: string;
  /** Классы ВНУТРЕННЕГО контейнера контента: паддинг (по умолчанию `p-4`), `space-y-*`, внутренняя сетка. */
  bodyClassName?: string;
  title?: string;
  actions?: ReactNode;
}

export function Panel({ children, className, bodyClassName, title, actions, ...rest }: PanelProps) {
  return (
    <div
      className={cn('bg-card text-card-foreground ring-foreground/10 rounded-xl shadow-sm ring-1', className)}
      {...rest}>
      {(title || actions) && (
        <div className="border-border flex flex-col items-start gap-2 border-b px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6">
          {title && <h3 className="min-w-0 truncate leading-none font-semibold tracking-tight">{title}</h3>}
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </div>
  );
}
