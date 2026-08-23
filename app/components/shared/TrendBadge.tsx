import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '~/lib/utils';
import type { MetricComparison } from '~/types/analytics';

interface TrendBadgeProps {
  comparison: MetricComparison;
  /** Рост — это хорошо (продажи, выручка) или плохо (возвраты, долг)? */
  positiveIsGood?: boolean;
  className?: string;
}

/**
 * Компактный бейдж со стрелкой и % изменения к предыдущему периоду.
 * `changePercent === null` — рост с нуля, показывать процент как ложь
 * нельзя (см. комментарий в types/analytics.ts), показываем просто "новое".
 */
export function TrendBadge({ comparison, positiveIsGood = true, className }: TrendBadgeProps) {
  const { difference, changePercent } = comparison;

  if (difference === 0) {
    return (
      <span className={cn('text-muted-foreground inline-flex items-center gap-0.5 text-xs', className)}>
        <Minus className="size-3" />
        0%
      </span>
    );
  }

  const isUp = difference > 0;
  const isGood = isUp === positiveIsGood;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium',
        isGood ? 'text-success' : 'text-destructive',
        className
      )}>
      {isUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {changePercent === null ? '—' : `${Math.abs(Math.round(changePercent))}%`}
    </span>
  );
}
