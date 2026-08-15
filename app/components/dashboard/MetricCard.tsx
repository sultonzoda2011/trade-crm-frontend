import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ComparisonIndicator } from '~/components/dashboard/ComparisonIndicator';
import { Panel } from '~/components/layout/Panel';
import { cn } from '~/lib/utils';
import type { MetricComparison } from '~/types/analytics';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  /** Secondary line: what the headline number is made of. */
  hint?: ReactNode;
  comparison?: MetricComparison;
  /** Set when growth of this metric is bad news (returns, overdue debt). */
  invertComparison?: boolean;
  /** Where this number can be inspected in detail. */
  to?: string;
  className?: string;
}

/**
 * A headline business number with its period-over-period change.
 *
 * Differs from the shared `StatCard` on purpose: that one is a compact,
 * centred counter for detail pages, this one is a dashboard KPI that carries
 * a trend and a drill-through. Keeping both avoids overloading either.
 */
export function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  comparison,
  invertComparison,
  to,
  className,
}: MetricCardProps) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground truncate text-xs font-medium tracking-wide uppercase">
          {label}
        </p>
        <Icon className="text-muted-foreground size-4 shrink-0" />
      </div>
      <p className="mt-2 truncate font-mono text-2xl font-bold">{value}</p>
      {hint && <p className="text-muted-foreground mt-1 truncate text-xs">{hint}</p>}
      {comparison && (
        <ComparisonIndicator comparison={comparison} invert={invertComparison} className="mt-2" />
      )}
    </>
  );

  return (
    <Panel className={cn('p-4', to && 'hover:bg-muted/40 transition-colors', className)}>
      {to ? (
        <Link to={to} className="block">
          {body}
        </Link>
      ) : (
        body
      )}
    </Panel>
  );
}
