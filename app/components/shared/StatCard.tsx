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
  size?: 'md' | 'sm';
  className?: string;
}
export function StatCard({ icon: Icon, label, value, to, state, size = 'md', className }: StatCardProps) {
  const classes = cn(
    // min-w-0: карточка почти всегда лежит в grid/flex-контейнере (StatRow и т.п.) —
    // без него содержимое (длинный лейбл или крупная сумма) может распирать
    // родительскую ячейку и вылезать за её границы вместо того чтобы аккуратно
    // обрезаться многоточием внутри своей же карточки.
    'bg-background/50 hover:bg-background/80 flex min-w-0 flex-col items-center rounded-xl transition-colors',
    size === 'md' ? 'gap-1.5 p-4' : 'gap-1 p-3',
    className
  );
  const content = (
    <>
      {' '}
      <Icon className="text-muted-foreground size-4 shrink-0" />{' '}
      <span
        className={cn(
          'text-muted-foreground w-full truncate text-center font-medium tracking-wider uppercase',
          size === 'md' ? 'text-xs' : 'text-[11px]'
        )}>
        {' '}
        {label}{' '}
      </span>{' '}
      <Badge variant="secondary" className={cn('max-w-full font-mono', size === 'md' && 'text-base')}>
        <span className="truncate">{value}</span>
      </Badge>{' '}
    </>
  );
  if (to) {
    return (
      <Link to={to} state={state} className={classes}>
        {' '}
        {content}{' '}
      </Link>
    );
  }
  return <div className={classes}>{content}</div>;
}
