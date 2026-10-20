import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Panel } from '~/components/layout/Panel';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '~/components/ui/chart';
import type { RevenueTrendData } from '~/types/dashboard';
import { fmtTJS } from '~/lib/format';
import { toDayjs } from '~/lib/date';

interface RevenueTrendChartProps {
  data: RevenueTrendData[];
  className?: string;
}

/** 12 400 → "12k": the axis only needs the scale, the exact amount is in the tooltip. */
function compactMoney(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${Math.round(value / 100_000) / 10}M`;
  if (abs >= 1_000) return `${Math.round(value / 100) / 10}k`.replace('.0k', 'k');
  return String(value);
}

function isMonthGranularity(data: RevenueTrendData[]): boolean {
  return data.length > 0 && data.every((item) => item.date.endsWith('-01'));
}

export function RevenueTrendChart({ data, className }: RevenueTrendChartProps) {
  const { t, i18n } = useTranslation(['dashboard']);

  const chartConfig = useMemo(
    () => ({
      revenue: {
        label: t('charts.revenue'),
        theme: { light: 'var(--chart-2)', dark: 'var(--chart-2)' },
      },
      transactionCount: {
        label: t('charts.transactions'),
        theme: { light: 'var(--chart-1)', dark: 'var(--chart-1)' },
      },
    }),
    [t]
  );

  const byMonth = isMonthGranularity(data);
  const lang = i18n.language;

  const monthFormatter = useMemo(
    () => (byMonth ? new Intl.DateTimeFormat(lang, { month: 'short' }) : null),
    [lang, byMonth]
  );

  const formattedData = useMemo(
    () =>
      data.map((item) => {
        const day = toDayjs(item.date);
        const dateLabel = day
          ? byMonth
            ? `${monthFormatter?.format(day.toDate()) ?? day.format('MMM')} ${day.year()}`
            : day.format('DD.MM')
          : item.date;
        return { ...item, dateLabel };
      }),
    [data, byMonth, monthFormatter]
  );

  const title = byMonth ? t('trend.byMonth') : t('trend.byDay');

  // A line needs two points. One day of sales is a dot, not a trend.
  if (data.length < 2) {
    return (
      <Panel title={title} className={className}>
        <p className="text-muted-foreground py-2 text-sm">{t('trend.notEnough')}</p>
      </Panel>
    );
  }

  return (
    <Panel title={title} className={className}>
      <ChartContainer config={chartConfig} initialDimension={{ width: 500, height: 250 }}>
        <LineChart data={formattedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
          <XAxis
            dataKey="dateLabel"
            stroke="var(--color-muted-foreground, #6b7280)"
            style={{ fontSize: '12px' }}
            minTickGap={24}
          />
          <YAxis
            stroke="var(--color-muted-foreground, #6b7280)"
            style={{ fontSize: '12px' }}
            width={40}
            tickFormatter={compactMoney}
          />
          <ChartTooltip
            cursor={{ stroke: 'var(--color-border, #e5e7eb)' }}
            content={
              <ChartTooltipContent
                formatter={(value, name, item) => {
                  const key = String(name ?? 'revenue');
                  const num = typeof value === 'number' ? value : Number(value);
                  return (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <span
                          className="size-2 shrink-0 rounded-xs"
                          style={{ backgroundColor: item.color ?? item.payload?.fill }}
                        />
                        {chartConfig[key as keyof typeof chartConfig]?.label ?? name}
                      </span>
                      <span className="font-mono font-medium tabular-nums">
                        {key === 'revenue' ? fmtTJS(num) : num.toLocaleString()}
                      </span>
                    </div>
                  );
                }}
              />
            }
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--color-revenue, #22c55e)"
            strokeWidth={2}
            dot={{ fill: 'var(--color-revenue, #22c55e)', r: data.length > 15 ? 0 : 3 }}
            activeDot={{ r: 6 }}
            isAnimationActive
          />
          {/* Invisible series so the tooltip shows the transaction count alongside revenue */}
          <Line
            type="monotone"
            dataKey="transactionCount"
            strokeWidth={0}
            dot={false}
            activeDot={false}
            legendType="none"
          />
        </LineChart>
      </ChartContainer>
    </Panel>
  );
}