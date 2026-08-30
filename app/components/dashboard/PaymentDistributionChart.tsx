import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Panel } from '~/components/layout/Panel';
import { StatRow } from '~/components/shared/StatRow';
import { fmtTJS } from '~/lib/format';
import type { PaymentTypeDistribution } from '~/types/dashboard';

interface PaymentDistributionChartProps {
  data: PaymentTypeDistribution[];
}

const CHART_COLORS: Record<PaymentTypeDistribution['type'], string> = {
  CASH: 'var(--chart-2)', // green
  CARD: 'var(--chart-1)', // blue
  CREDIT: 'var(--chart-3)', // amber
};

interface PaymentTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: PaymentTypeDistribution }>;
  labels: Record<string, string>;
  transactionsLabel: string;
}

function PaymentTooltip({ active, payload, labels, transactionsLabel }: PaymentTooltipProps) {
  const item = active && payload?.[0]?.payload;
  if (!item) return null;

  return (
    <div className="border-border/50 bg-background rounded-lg border px-3 py-2 text-xs shadow-xl">
      <p className="font-medium">{labels[item.type] ?? item.type}</p>
      <p className="text-muted-foreground">{fmtTJS(item.amount)}</p>
      <p className="text-muted-foreground">
        {item.count} {transactionsLabel}
      </p>
      <p className="mt-1 font-semibold">{item.percentage.toFixed(1)}%</p>
    </div>
  );
}

export function PaymentDistributionChart({ data }: PaymentDistributionChartProps) {
  const { t } = useTranslation(['dashboard', 'transactions']);

  const labels = useMemo(
    () => ({
      CASH: t('paymentType.CASH', { ns: 'transactions' }),
      CARD: t('paymentType.CARD', { ns: 'transactions' }),
      CREDIT: t('paymentType.CREDIT', { ns: 'transactions' }),
    }),
    [t]
  );

  if (data.length === 0) {
    return (
      <Panel title={t('paymentTypes')} className="col-span-1">
        <p className="text-muted-foreground py-6 text-center text-sm">{t('empty')}</p>
      </Panel>
    );
  }

  const formattedData = data.map((item) => ({
    ...item,
    label: labels[item.type] ?? item.type,
  }));

  return (
    <Panel title={t('paymentTypes')} className="col-span-1" bodyClassName="flex flex-col">
      <div className="flex flex-1 items-center justify-center">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={formattedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ percent = 0 }) => `${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="var(--chart-1)"
              dataKey="amount">
              {formattedData.map((entry) => (
                <Cell key={entry.type} fill={CHART_COLORS[entry.type]} />
              ))}
            </Pie>
            <Tooltip content={<PaymentTooltip labels={labels} transactionsLabel={t('charts.transactions')} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <StatRow className="border-border mt-4 border-t pt-4">
        {formattedData.map((item) => (
          <div key={item.type} className="text-center">
            <p className="text-xs font-medium">{item.label}</p>
            <p className="text-muted-foreground mt-1 text-xs">{fmtTJS(item.amount)}</p>
            <p className="text-muted-foreground text-xs">{item.percentage.toFixed(1)}%</p>
          </div>
        ))}
      </StatRow>
    </Panel>
  );
}
