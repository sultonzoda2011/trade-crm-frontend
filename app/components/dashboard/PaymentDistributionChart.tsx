import { useTranslation } from 'react-i18next';

import { Panel } from '~/components/layout/Panel';
import { fmtTJS } from '~/lib/format';
import type { PaymentTypeDistribution } from '~/types/dashboard';

interface PaymentDistributionChartProps {
  data: PaymentTypeDistribution[];
}

type PaymentType = PaymentTypeDistribution['type'];

/** Fixed order and colours, so "cash" is the same green on every visit. */
const ORDER: PaymentType[] = ['CASH', 'CARD', 'CREDIT'];
const COLORS: Record<PaymentType, string> = {
  CASH: 'var(--chart-2)', // green
  CARD: 'var(--chart-1)', // blue
  CREDIT: 'var(--chart-3)', // amber
};

/**
 * How the sold amount was paid: cash, card or on credit.
 *
 * The backend counts these net of returns over the same rows as the headline
 * "sold" figure, so the three parts add up to it. A single bar with a legend
 * replaces the old pie: shares read faster as lengths, and every share also has
 * its name, amount and percent written out (colour is never the only signal).
 */
export function PaymentDistributionChart({ data }: PaymentDistributionChartProps) {
  const { t } = useTranslation(['dashboard', 'transactions']);

  const labels: Record<PaymentType, string> = {
    CASH: t('payments.CASH'),
    CARD: t('payments.CARD'),
    CREDIT: t('payments.CREDIT'),
  };

  const rows = ORDER.map((type) => data.find((item) => item.type === type)).filter(
    (item): item is PaymentTypeDistribution => Boolean(item) && (item?.amount ?? 0) > 0
  );

  if (rows.length === 0) {
    return (
      <Panel title={t('payments.title')}>
        <p className="text-muted-foreground py-2 text-sm">{t('payments.empty')}</p>
      </Panel>
    );
  }

  const summary = rows.map((row) => `${labels[row.type]} ${row.percentage}%`).join(', ');

  return (
    <Panel title={t('payments.title')} bodyClassName="space-y-4">
      <div className="bg-muted flex h-3 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label={summary}>
        {rows.map((row) => (
          <div
            key={row.type}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ flexGrow: row.amount, flexBasis: 0, backgroundColor: COLORS[row.type] }}
          />
        ))}
      </div>

      <div className="divide-border divide-y">
        {rows.map((row) => (
          <div key={row.type} className="flex min-h-12 items-center gap-3 py-2">
            <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: COLORS[row.type] }} />
            <span className="min-w-0 flex-1 text-base leading-snug">{labels[row.type]}</span>
            <span className="shrink-0 text-right">
              <span className="block font-mono text-base font-semibold tabular-nums">{fmtTJS(row.amount)}</span>
              <span className="text-muted-foreground block text-sm leading-tight">{row.percentage}%</span>
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
