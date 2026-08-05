import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { Panel } from '~/components/layout/Panel';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '~/components/ui/chart';
import type { RevenueTrendData } from '~/types/dashboard';
import { fmtTJS } from '~/lib/format';
import dayjs from 'dayjs';

interface RevenueTrendChartProps {
  data: RevenueTrendData[];
}

const chartConfig = {
  revenue: {
    label: 'Revenue',
    theme: {
      light: '#22c55e',
      dark: '#22c55e',
    },
  },
  transactionCount: {
    label: 'Transactions',
    theme: {
      light: '#3b82f6',
      dark: '#3b82f6',
    },
  },
};

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  const { t } = useTranslation(['dashboard']);

  if (!data || data.length === 0) {
    return (
      <Panel title={t('revenueTrend')} className="col-span-2">
        <p className="text-muted-foreground py-6 text-center text-sm">{t('empty')}</p>
      </Panel>
    );
  }

  const formattedData = data.map((item) => ({
    ...item,
    dateLabel: dayjs(item.date).format('DD.MM'),
  }));

  return (
    <Panel title={t('revenueTrend')} className="col-span-2">
      <ChartContainer config={chartConfig} initialDimension={{ width: 500, height: 250 }}>
        <LineChart data={formattedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
          <XAxis
            dataKey="dateLabel"
            stroke="var(--color-muted-foreground, #6b7280)"
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke="var(--color-muted-foreground, #6b7280)" style={{ fontSize: '12px' }} />
          <ChartTooltip
            cursor={{ stroke: 'var(--color-border, #e5e7eb)' }}
            content={<ChartTooltipContent />}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--color-revenue, #22c55e)"
            strokeWidth={2}
            dot={{ fill: 'var(--color-revenue, #22c55e)', r: 4 }}
            activeDot={{ r: 6 }}
            isAnimationActive
          />
        </LineChart>
      </ChartContainer>
    </Panel>
  );
}
