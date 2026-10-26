import { CheckCircle2 } from 'lucide-react';
import { cn } from '~/lib/utils';

interface DashboardSuccessStateProps {
  title: string;
  hint?: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Единый блок «Всё в порядке» для карточек дашборда (AttentionList, DebtsCard, StockWatch, StockHealth, ReturnsPanel).
 */
export function DashboardSuccessState({
  title,
  hint,
  size = 'md',
  className,
}: DashboardSuccessStateProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span
        className={cn(
          'bg-success/10 text-success flex shrink-0 items-center justify-center rounded-full',
          size === 'sm' ? 'size-8' : 'size-10'
        )}>
        <CheckCircle2 className={size === 'sm' ? 'size-4' : 'size-5'} />
      </span>
      <div className="min-w-0">
        <p className={cn('text-base leading-snug', hint || size === 'md' ? 'font-semibold' : undefined)}>{title}</p>
        {hint && <p className="text-muted-foreground text-sm leading-snug">{hint}</p>}
      </div>
    </div>
  );
}
