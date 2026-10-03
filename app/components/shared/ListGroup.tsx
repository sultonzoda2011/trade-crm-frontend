import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '~/lib/utils';

interface ListGroupProps {
  /** Заголовок секции над карточкой (мелкие серые капсы, как в «Настройках» iOS). */
  title?: ReactNode;
  /** Действие справа от заголовка: «Все», «Изменить». */
  action?: ReactNode;
  /** Пояснение под карточкой. */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Секция сгруппированного списка iOS: заголовок сверху, белая карточка с
 * разделителями между строками, при необходимости пояснение снизу. Вместо
 * россыпи отдельных карточек с рамками — один спокойный блок на тему.
 */
export function ListGroup({ title, action, footer, children, className }: ListGroupProps) {
  return (
    <section className={className}>
      {(title || action) && (
        <div className="flex items-end justify-between gap-3 px-4 pb-1.5">
          <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{title}</h3>
          {action && <div className="text-sm font-medium">{action}</div>}
        </div>
      )}
      <div className="bg-card divide-border divide-y overflow-hidden rounded-2xl">{children}</div>
      {footer && <p className="text-muted-foreground px-4 pt-1.5 text-xs">{footer}</p>}
    </section>
  );
}

interface ListRowProps {
  /** Значок слева (иконка/аватар). */
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Значение справа (серое) — для строк «подпись: значение». */
  value?: ReactNode;
  valueClassName?: string;
  /** Переход на страницу — рисует шеврон и подсветку нажатия. */
  to?: string;
  state?: unknown;
  onClick?: () => void;
  /** Шеврон справа; по умолчанию — для строк-ссылок (`to`). */
  chevron?: boolean;
  /** Красный текст — для «Удалить». */
  destructive?: boolean;
  className?: string;
}

/** Строка сгруппированного списка: от 48px высотой, тап подсвечивается серым. */
export function ListRow({
  leading,
  title,
  subtitle,
  value,
  valueClassName,
  to,
  state,
  onClick,
  chevron = !!to,
  destructive,
  className,
}: ListRowProps) {
  const interactive = !!to || !!onClick;
  const classes = cn(
    'flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left text-base',
    interactive && 'active:bg-muted/70 cursor-pointer transition-colors',
    destructive && 'text-destructive',
    className
  );
  const content = (
    <>
      {leading && <span className="shrink-0">{leading}</span>}
      <span className="min-w-0 flex-1">
        <span className="block leading-snug">{title}</span>
        {subtitle && <span className="text-muted-foreground block text-sm leading-snug">{subtitle}</span>}
      </span>
      {value !== undefined && value !== null && (
        <span className={cn('text-muted-foreground max-w-[60%] shrink-0 text-right', valueClassName)}>{value}</span>
      )}
      {chevron && <ChevronRight className="text-muted-foreground/50 -mr-1 size-5 shrink-0" />}
    </>
  );

  if (to) {
    return (
      <Link to={to} state={state} className={classes}>
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {content}
      </button>
    );
  }
  return <div className={classes}>{content}</div>;
}
