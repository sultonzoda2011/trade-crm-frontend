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
  // Без заголовка — просто белая карточка.
  if (!title && !actions) {
    return (
      <div className={cn('bg-card text-card-foreground rounded-2xl', className)} {...rest}>
        <div className={cn('p-4', bodyClassName)}>{children}</div>
      </div>
    );
  }

  // С заголовком — как секция в iOS «Настройках»: мелкая серая подпись НАД
  // карточкой, а не рамка с линией внутри. Классы раскладки (`lg:col-span-2`,
  // `h-full`) остаются на внешнем блоке, карточка растягивается на всю высоту.
  return (
    <div className={cn('flex flex-col', className)} {...rest}>
      <div className="mb-1.5 flex items-end justify-between gap-3 px-1">
        {title && <h3 className="text-muted-foreground min-w-0 break-words text-xs font-medium tracking-wide uppercase">{title}</h3>}
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 text-sm">{actions}</div>}
      </div>
      <div className={cn('bg-card text-card-foreground flex-1 rounded-2xl p-4', bodyClassName)}>{children}</div>
    </div>
  );
}
