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
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground min-w-0 truncate text-sm font-medium">{label}</p>

        <span className="bg-primary/12 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
          <Icon className="size-[18px]" />
        </span>
      </div>

      <p className="mt-1.5 truncate font-mono text-2xl leading-tight font-bold tabular-nums md:text-[clamp(1.35rem,2vw,1.75rem)]">{value}</p>

      {hint && <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">{hint}</p>}

      {comparison && <ComparisonIndicator comparison={comparison} invert={invertComparison} className="mt-auto pt-2" />}
    </div>
  );

  return (
    <Panel bodyClassName="p-3.5 md:p-4" className={cn('h-full min-h-0', to && 'active:bg-muted/70 transition-colors', className)}>
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
