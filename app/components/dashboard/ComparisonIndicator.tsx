import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '~/lib/utils';
import type { MetricComparison } from '~/types/analytics';

interface ComparisonIndicatorProps {
  comparison: MetricComparison;
  /**
   * For most metrics growth is good. For returns and overdue debt it is not,
   * so the colour has to be inverted — green must never mean "more refunds".
   */
  invert?: boolean;
  className?: string;
}

/**
 * Period-over-period change of one metric.
 *
 * Three distinct outcomes, deliberately kept apart:
 *  - `changePercent === null` — the previous window was zero, so there is no
 *    percentage to show. We say "no comparison" instead of inventing +100%.
 *  - `0` — genuinely unchanged.
 *  - anything else — signed change, coloured by whether it is good news.
 */
export function ComparisonIndicator({ comparison, invert, className }: ComparisonIndicatorProps) {
  const { t } = useTranslation('dashboard');
  const { changePercent } = comparison;

  if (changePercent === null) {
    return (
      <span className={cn('text-muted-foreground text-xs', className)}>
        {t('comparison.noBaseline')}
      </span>
    );
  }

  if (changePercent === 0) {
    return (
      <span className={cn('text-muted-foreground inline-flex items-center gap-1 text-xs', className)}>
        <Minus className="h-3 w-3" />
        {t('comparison.unchanged')}
      </span>
    );
  }

  const isUp = changePercent > 0;
  const isGood = invert ? !isUp : isUp;
  const Icon = isUp ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        isGood ? 'text-success' : 'text-destructive',
        className
      )}>
      <Icon className="h-3 w-3" />
      {isUp ? '+' : ''}
      {changePercent}%
      <span className="text-muted-foreground font-normal">{t('comparison.vsPrevious')}</span>
    </span>
  );
}
