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
  hint?: ReactNode;
  comparison?: MetricComparison;
  invertComparison?: boolean;
  to?: string;
  className?: string;
}

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
    <div className="flex h-full min-h-[clamp(112px,9vw,144px)] flex-col">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground min-w-0 truncate text-xs font-medium tracking-wide uppercase">{label}</p>

        <Icon className="text-muted-foreground size-4 shrink-0" />
      </div>

      <p className="mt-2 truncate font-mono text-[clamp(1.35rem,2vw,1.75rem)] font-bold tabular-nums">{value}</p>

      {hint && <p className="text-muted-foreground mt-1 truncate text-xs">{hint}</p>}

      {comparison && <ComparisonIndicator comparison={comparison} invert={invertComparison} className="mt-auto pt-2" />}
    </div>
  );

  return (
    <Panel className={cn('h-full min-h-0', to && 'hover:bg-muted/40 transition-colors', className)}>
      {to ? (
        <Link to={to} className="block h-full focus-visible:outline-none">
          {body}
        </Link>
      ) : (
        body
      )}
    </Panel>
  );
}
