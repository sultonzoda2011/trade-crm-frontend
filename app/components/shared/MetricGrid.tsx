import type { ReactNode } from 'react';
import { METRIC_TONE_CLASS, type MetricTone } from '~/config/tones';
import { cn } from '~/lib/utils';

export interface Metric {
  label: string;
  value: ReactNode;
  /** Динамика к прошлому периоду (`TrendBadge`) — стоит под значением. */
  trend?: ReactNode;
  tone?: MetricTone;
}

interface MetricGridProps {
  title?: ReactNode;
  metrics: Metric[];
  className?: string;
}

/** Плитки показателей (выручка, продано, возвраты): цифра крупно, подпись мелко, динамика под ней. */
export function MetricGrid({ title, metrics, className }: MetricGridProps) {
  return (
    <section className={className}>
      {title ? (
        <h3 className="text-muted-foreground px-4 pb-1.5 text-xs font-medium tracking-wide uppercase">{title}</h3>
      ) : null}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-card min-w-0 rounded-2xl p-3.5">
            <p className="text-muted-foreground text-xs leading-tight break-words">{metric.label}</p>
            <p
              className={cn(
                'mt-1 text-lg leading-tight font-semibold break-words tabular-nums',
                METRIC_TONE_CLASS[metric.tone ?? 'default']
              )}>
              {metric.value}
            </p>
            {metric.trend ? <div className="mt-1">{metric.trend}</div> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
