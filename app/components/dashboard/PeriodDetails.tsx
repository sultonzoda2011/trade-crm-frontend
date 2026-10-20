import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { ComparisonIndicator } from '~/components/dashboard/ComparisonIndicator';
import { Panel } from '~/components/layout/Panel';
import { MIN_DAYS_FOR_TREND } from '~/config/dashboard';
import { transactionsLink, type DashboardScope } from '~/lib/dashboard-links';
import { fmtNum, fmtTJS } from '~/lib/format';
import { cn } from '~/lib/utils';
import type { OverviewData } from '~/types/dashboard';

interface PeriodDetailsProps {
  overview: Pick<OverviewData, 'sales' | 'returns' | 'period'>;
  scope: DashboardScope;
}

interface DetailRowProps {
  label: string;
  value: string;
  hint?: React.ReactNode;
  muted?: boolean;
  to?: string;
}

function DetailRow({ label, value, hint, muted, to }: DetailRowProps) {
  const content = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block text-base leading-snug">{label}</span>
        {hint && <span className="text-muted-foreground block text-sm leading-snug">{hint}</span>}
      </span>
      <span className={cn('shrink-0 font-mono text-base font-semibold tabular-nums', muted && 'text-muted-foreground')}>
        {value}
      </span>
      {to && <ChevronRight className="text-muted-foreground/60 -mr-1 size-4 shrink-0" />}
    </>
  );

  const classes = 'flex min-h-14 items-center gap-3 px-4 py-2.5';

  return to ? (
    <Link to={to} className={cn(classes, 'active:bg-muted/70 transition-colors')}>
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  );
}

/**
 * The supporting figures of the period as one plain list: how many operations,
 * the average receipt, discounts and returns. They explain the headline numbers
 * but are not worth a card each.
 */
export function PeriodDetails({ overview, scope }: PeriodDetailsProps) {
  const { t } = useTranslation('dashboard');
  const { sales, returns } = overview;
  const durationDays = overview.period?.durationDays ?? (scope.period === 'today' ? 1 : MIN_DAYS_FOR_TREND);
  const comparable = durationDays >= MIN_DAYS_FOR_TREND;

  return (
    <Panel title={t('details.title')} bodyClassName="overflow-hidden p-0">
      <div className="divide-border divide-y">
        <DetailRow
          label={t('details.operations')}
          value={fmtNum(sales.transactionCount)}
          muted={sales.transactionCount === 0}
          hint={t('details.operationsHint', { sales: sales.saleCount, debts: sales.debtCount })}
          to={transactionsLink(scope)}
        />

        <DetailRow
          label={t('details.averageCheck')}
          value={fmtTJS(sales.averageCheck)}
          muted={sales.averageCheck === 0}
          hint={
            comparable && sales.transactionCount > 0 ? (
              <ComparisonIndicator comparison={sales.comparison.averageCheck} vsLabel={t(`summary.vs.${scope.period}`)} />
            ) : undefined
          }
        />

        <DetailRow
          label={t('details.discounts')}
          value={fmtTJS(sales.discountAmount)}
          muted={sales.discountAmount === 0}
          hint={sales.discountAmount > 0 ? t('details.discountsHint') : undefined}
        />

        <DetailRow
          label={t('details.returns')}
          value={fmtTJS(returns.amount)}
          muted={returns.units === 0}
          hint={
            returns.units > 0
              ? t('details.returnsHint', {
                  units: returns.units,
                  percent: Math.round(returns.returnRate * 1000) / 10,
                })
              : t('details.returnsNone')
          }
          to={returns.units > 0 ? transactionsLink(scope, { type: 'REFUND' }) : undefined}
        />
      </div>
    </Panel>
  );
}
