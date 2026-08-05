import { useTranslation } from 'react-i18next';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Panel } from '~/components/layout/Panel';
import { fmtTJS } from '~/lib/format';
import type { PaymentTypeDistribution } from '~/types/dashboard';

interface PaymentDistributionChartProps {
  data: PaymentTypeDistribution[];
}

const COLORS = {
  CASH: '#10b981', // emerald
  CARD: '#3b82f6', // blue
  CREDIT: '#f59e0b', // amber
};

const chartConfig = {
  CASH: {
    label: 'Cash',
    color: '#10b981',
    theme: {
      light: '#10b981',
      dark: '#10b981',
    },
  },
  CARD: {
    label: 'Card',
    color: '#3b82f6',
    theme: {
      light: '#3b82f6',
      dark: '#3b82f6',
    },
  },
  CREDIT: {
    label: 'Credit',
    color: '#f59e0b',
    theme: {
      light: '#f59e0b',
      dark: '#f59e0b',
    },
  },
};

export function PaymentDistributionChart({ data }: PaymentDistributionChartProps) {
  const { t } = useTranslation(['dashboard']);

  if (!data || data.length === 0) {
    return (
      <Panel title={t('paymentTypes')} className="col-span-1">
        <p className="text-muted-foreground py-6 text-center text-sm">{t('empty')}</p>
      </Panel>
    );
  }

  const formattedData = data.map((item) => ({
    ...item,
    label: chartConfig[item.type as keyof typeof chartConfig]?.label || item.type,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="border-border/50 bg-background rounded-lg border px-3 py-2 text-xs shadow-xl">
          <p className="font-medium">{data.label}</p>
          <p className="text-muted-foreground">{fmtTJS(data.amount)}</p>
          <p className="text-muted-foreground">{data.count} transactions</p>
          <p className="mt-1 font-semibold">{data.percentage.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Panel title={t('paymentTypes')} className="col-span-1 flex flex-col">
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
              fill="#8884d8"
              dataKey="amount">
              {formattedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.type as keyof typeof COLORS]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="border-border mt-4 grid grid-cols-3 gap-2 border-t pt-4">
        {formattedData.map((item) => (
          <div key={item.type} className="text-center">
            <p className="text-xs font-medium">{item.label}</p>
            <p className="text-muted-foreground mt-1 text-xs">{fmtTJS(item.amount)}</p>
            <p className="text-muted-foreground text-xs">{item.percentage.toFixed(1)}%</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
