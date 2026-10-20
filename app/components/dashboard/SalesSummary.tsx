import { ChevronRight, HandCoins, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { ComparisonIndicator } from '~/components/dashboard/ComparisonIndicator';
import { Panel } from '~/components/layout/Panel';
import { AnimatedNumber } from '~/components/shared/AnimatedNumber';
import { MIN_DAYS_FOR_TREND } from '~/config/dashboard';
import { transactionsLink, type DashboardScope } from '~/lib/dashboard-links';
import { fmtTJS } from '~/lib/format';
import { cn } from '~/lib/utils';
import type { OverviewData } from '~/types/dashboard';

interface SalesSummaryProps {
  overview: Pick<OverviewData, 'sales' | 'debts' | 'returns' | 'period'>;
  scope: DashboardScope;
}

const money = (value: number) => Math.round(value * 100) / 100;

const ROW_TONE = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
} as const;

interface SummaryRowProps {
  icon: LucideIcon;
  tone: keyof typeof ROW_TONE;
  label: string;
  hint: string;
  value: number;
  to: string;
}

function SummaryRow({ icon: Icon, tone, label, hint, value, to }: SummaryRowProps) {
  return (
    <Link to={to} className="active:bg-muted/70 flex min-h-16 items-center gap-3 px-4 py-3 transition-colors">
      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', ROW_TONE[tone])}>
        <Icon className="size-5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="min-w-0 text-base leading-snug font-semibold">{label}</span>
          <span className={cn('shrink-0 font-mono text-base font-semibold tabular-nums', value === 0 && 'text-muted-foreground')}>
            {fmtTJS(value)}
          </span>
        </span>
        <span className="text-muted-foreground mt-0.5 block text-sm leading-snug">{hint}</span>
      </span>

      <ChevronRight className="text-muted-foreground/60 -mr-1 size-4 shrink-0" />
    </Link>
  );
}

/**
 * The first answer of the evening: how much was sold, how much of it is money in
 * hand, and how much was handed out on credit.
 *
 * Three different things, kept apart on purpose:
 *  - sold      — value of goods that left the shelves, cash and credit together,
 *                net of returns (`netRevenue`);
 *  - received  — cash/card sales plus payments on older debts collected in the
 *                period. Only this is money the owner can actually count;
 *  - credit    — goods given on credit; it becomes money later, if at all.
 * sold = received-for-goods + credit, so the numbers add up on screen.
 *
 * With a seller picked, the backend still counts collected payments for the whole
 * shop, so adding them to one seller's sales would overstate the seller. In that
 * case only the seller's own cash/card sales are shown as received.
 */
export function SalesSummary({ overview, scope }: SalesSummaryProps) {
  const { t } = useTranslation('dashboard');
  const { sales, debts, returns } = overview;
  const { period } = scope;

  const sellerScoped = Boolean(scope.sellerId);
  const received = money(sales.saleRevenue + (sellerScoped ? 0 : debts.collectedAmount));
  const hasPayments = !sellerScoped && debts.collectedAmount > 0;

  const comparison = sales.comparison.netRevenue;
  const durationDays = overview.period?.durationDays ?? (period === 'today' ? 1 : MIN_DAYS_FOR_TREND);
  const comparable = durationDays >= MIN_DAYS_FOR_TREND;

  let receivedHint: string;
  if (sellerScoped) {
    receivedHint = t('summary.received.hintSeller');
  } else if (hasPayments) {
    receivedHint = t('summary.received.hintWithPayments', {
      sales: fmtTJS(sales.saleRevenue),
      payments: fmtTJS(debts.collectedAmount),
    });
  } else {
    receivedHint = t('summary.received.hintSalesOnly');
  }

  let trend: React.ReactNode = null;
  if (sales.transactionCount === 0) {
    trend = <span className="text-muted-foreground">{t(`summary.noSales.${period}`)}</span>;
  } else if (comparable) {
    trend = <ComparisonIndicator comparison={comparison} vsLabel={t(`summary.vs.${period}`)} className="text-sm" />;
  } else if (comparison.previous > 0) {
    trend = (
      <span className="text-muted-foreground">
        {t(`summary.previousWas.${period}`, { amount: fmtTJS(comparison.previous) })}
      </span>
    );
  } else {
    trend = <span className="text-muted-foreground">{t(`summary.previousNone.${period}`)}</span>;
  }

  return (
    <Panel className="overflow-hidden" bodyClassName="p-0">
      <div className="px-4 pt-4 pb-3">
        <p className="text-muted-foreground text-sm font-medium">{t(`summary.sold.${period}`)}</p>

        <p className="mt-1 font-mono text-3xl leading-tight font-bold tabular-nums break-words md:text-4xl">
          <AnimatedNumber value={sales.netRevenue} format={fmtTJS} />
        </p>

        <p className="mt-1.5 min-h-5 text-sm">{trend}</p>
      </div>

      <div className="divide-border border-border divide-y border-t">
        <SummaryRow
          icon={Wallet}
          tone="success"
          label={sellerScoped ? t('summary.received.titleSeller') : t('summary.received.title')}
          hint={receivedHint}
          value={received}
          to={transactionsLink(scope, { type: 'SALE' })}
        />

        <SummaryRow
          icon={HandCoins}
          tone="warning"
          label={t('summary.credit.title')}
          hint={sales.debtCount > 0 ? t('summary.credit.hint', { count: sales.debtCount }) : t('summary.credit.none')}
          value={sales.debtIssued}
          to={transactionsLink(scope, { type: 'DEBT' })}
        />
      </div>

      {returns.amount > 0 && (
        <p className="text-muted-foreground border-border border-t px-4 py-3 text-sm leading-snug">
          {t('summary.returnsNote', { amount: fmtTJS(returns.amount) })}
        </p>
      )}
    </Panel>
  );
}
