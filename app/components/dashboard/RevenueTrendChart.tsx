import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from 'recharts';
import { useId, useMemo } from 'react';
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
  const gradientId = useId().replace(/:/g, '');

  const chartConfig = useMemo(
    () => ({
      revenue: {
        label: t('charts.revenue'),
        theme: { light: 'var(--primary)', dark: 'var(--primary)' },
      },
      transactionCount: {
        label: t('charts.transactions'),
        theme: { light: 'var(--muted-foreground)', dark: 'var(--muted-foreground)' },
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
      <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full" initialDimension={{ width: 500, height: 256 }}>
        <AreaChart data={formattedData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id={`revenue-fill-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-revenue, #007aff)" stopOpacity={0.14} />
              <stop offset="100%" stopColor="var(--color-revenue, #007aff)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--color-border, rgba(60, 60, 67, 0.16))" />
          <XAxis
            dataKey="dateLabel"
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            stroke="var(--color-muted-foreground, #6c6c70)"
            style={{ fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}
            minTickGap={24}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            stroke="var(--color-muted-foreground, #6c6c70)"
            style={{ fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}
            width={44}
            tickFormatter={compactMoney}
          />
          <ChartTooltip
            cursor={{ stroke: 'var(--color-border, rgba(60, 60, 67, 0.16))' }}
            content={
              <ChartTooltipContent
                formatter={(value, name, item) => {
                  const key = String(name ?? 'revenue');
                  const num = typeof value === 'number' ? value : Number(value);
                  return (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <span
                          className="size-2 shrink-0 rounded-full"
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
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="var(--color-revenue, #007aff)"
            strokeWidth={2}
            fill={`url(#revenue-fill-${gradientId})`}
            dot={{ fill: 'var(--color-revenue, #007aff)', r: data.length > 15 ? 0 : 3, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            isAnimationActive={false}
          />
          {/* Invisible series so the tooltip shows the transaction count alongside revenue */}
          <Line
            type="monotone"
            dataKey="transactionCount"
            stroke="var(--color-transactionCount, #6c6c70)"
            strokeWidth={0}
            dot={false}
            activeDot={false}
            legendType="none"
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
    </Panel>
  );
}
