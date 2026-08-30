import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Badge } from '~/components/ui/badge';
import { cn } from '~/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  to?: string;
  state?: unknown;
  /**
   * `center` — компактный счётчик по центру (детальные страницы, `StatRow`).
   * `start` — плитка дашборда: иконка в подложке слева, подпись над числом.
   */
  align?: 'center' | 'start';
  size?: 'md' | 'sm';
  /** Акцент на самом числе: `text-destructive`, `text-warning`, `text-success`. */
  valueClassName?: string;
  /** Тон подложки иконки у `align="start"` — по умолчанию `primary`. */
  iconClassName?: string;
  className?: string;
}

/**
 * Единственная плитка «иконка + подпись + число» на весь проект.
 *
 * До этого одно и то же было написано пять раз: здесь, в `InventoryHealth`, в
 * сводке по складу на `overview`, и отдельным **локальным `StatCard`** в
 * `sellers-report`, который затенял этот импортом-одноимённцем. Числа
 * расходились по размеру (`text-sm` на мобильном против `text-xl`), иконки были
 * то у всех плиток, то у одной, а в сводке по складу три плитки из четырёх были
 * ссылками, а четвёртая — `div`.
 *
 * `MetricCard` (дашборд) остаётся отдельно намеренно: это KPI с трендом и
 * сравнением по периодам, другой формат.
 *
 * `hover:bg-muted` теперь только у ссылок: у некликабельной плитки подсветка
 * под курсором обещала переход, которого нет.
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  to,
  state,
  align = 'center',
  size = 'md',
  valueClassName,
  iconClassName,
  className,
}: StatCardProps) {
  const classes = cn(
    // min-w-0: плитка почти всегда лежит в grid/flex-контейнере (StatRow и т.п.) —
    // без него содержимое (длинный лейбл или крупная сумма) может распирать
    // родительскую ячейку и вылезать за её границы вместо того чтобы аккуратно
    // обрезаться многоточием внутри своей же плитки.
    'bg-muted/50 ring-foreground/5 flex min-w-0 rounded-xl ring-1 transition-colors',
    to && 'hover:bg-muted',
    align === 'center'
      ? size === 'md'
        ? 'flex-col items-center gap-1.5 p-4'
        : 'flex-col items-center gap-1 p-3'
      : size === 'md'
        ? 'items-center gap-3 p-4'
        : 'items-center gap-2.5 p-3',
    className
  );

  const content =
    align === 'center' ? (
      <>
        <Icon className="text-muted-foreground size-4 shrink-0" />

        <span
          className={cn(
            'text-muted-foreground w-full truncate text-center font-medium tracking-wider uppercase',
            size === 'md' ? 'text-xs' : 'text-2xs'
          )}>
          {label}
        </span>

        <Badge
          variant="secondary"
          className={cn('max-w-full font-mono', size === 'md' ? 'text-lg' : 'text-base', valueClassName)}>
          <span className="truncate">{value}</span>
        </Badge>
      </>
    ) : (
      <>
        <span
          className={cn(
            'bg-primary/10 text-primary flex shrink-0 items-center justify-center rounded-lg',
            size === 'md' ? 'size-10' : 'size-9',
            iconClassName
          )}>
          <Icon className={size === 'md' ? 'size-5' : 'size-4'} />
        </span>

        <span className="min-w-0 flex-1">
          {/* line-clamp, а не truncate: подписи вроде «Нет в наличии» на 360px в
              две колонки в одну строку не влезают, а обрезать их многоточием
              означает потерять смысл плитки. */}
          <span className="text-muted-foreground text-2xs line-clamp-2 leading-snug font-medium sm:text-xs">
            {label}
          </span>

          <span className={cn('block truncate font-mono text-lg font-bold sm:text-xl', valueClassName)}>{value}</span>
        </span>
      </>
    );

  if (to) {
    return (
      <Link to={to} state={state} className={classes}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}
