import { AlertCircle, ChevronRight, Clock, Hourglass } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { DashboardSuccessState } from '~/components/dashboard/DashboardSuccessState';
import { ROW_TONE, type RowTone } from '~/components/dashboard/rowTone';
import { Panel } from '~/components/layout/Panel';
import { Button } from '~/components/ui/button';
import { debtsLink, type DashboardScope } from '~/lib/dashboard-links';
import { fmtTJS } from '~/lib/format';
import { cn } from '~/lib/utils';
import type { OverviewDebts } from '~/types/dashboard';

interface DebtsCardProps {
  debts: OverviewDebts;
  scope: DashboardScope;
  /** The "due soon" window in days, as the backend rule reported it. Unknown when no debt is due soon. */
  dueSoonDays?: number;
}

const money = (value: number) => Math.round(value * 100) / 100;

interface DebtLineProps {
  icon: LucideIcon;
  tone: RowTone;
  label: string;
  hint: string;
  amount: number;
  to?: string;
}

function DebtLine({ icon: Icon, tone, label, hint, amount, to }: DebtLineProps) {
  const content = (
    <>
      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', ROW_TONE[tone].badge)}>
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="min-w-0 text-base leading-snug font-semibold">{label}</span>
          <span className={cn('shrink-0 font-mono text-base font-semibold tabular-nums', ROW_TONE[tone].amount)}>
            {fmtTJS(amount)}
          </span>
        </span>
        <span className="text-muted-foreground mt-0.5 block text-sm leading-snug">{hint}</span>
      </span>
      {to && <ChevronRight className="text-muted-foreground/60 -mr-1 size-4 shrink-0" />}
    </>
  );

  const classes = 'flex min-h-16 items-center gap-3 px-4 py-3';

  return to ? (
    <Link to={to} className={cn(classes, 'active:bg-muted/70 transition-colors')}>
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  );
}

/**
 * Who owes the shop money, as of right now — not "debts issued in the period".
 *
 * Three groups that add up to the total: overdue, due within the next few days,
 * and the rest. A debt with no due date can never be overdue (the backend has
 * nothing to compare), so "the rest" is worded as "not due yet or no date set"
 * instead of implying those debts are safe.
 *
 * The lines open the same transaction lists the figures were counted from
 * (`debtStatus=OVERDUE` / `DUE_SOON`), so "5 overdue" here is five rows there.
 */
export function DebtsCard({ debts, scope, dueSoonDays }: DebtsCardProps) {
  const { t } = useTranslation('dashboard');

  if (debts.totalOutstanding <= 0) {
    return (
      <Panel title={t('debtsCard.title')} bodyClassName="p-4">
        <DashboardSuccessState title={t('debtsCard.none')} hint={t('debtsCard.noneHint')} />
      </Panel>
    );
  }

  const restCount = Math.max(debts.activeDebtCount - debts.overdueCount - debts.dueSoonCount, 0);
  const restAmount = Math.max(money(debts.totalOutstanding - debts.overdueAmount - debts.dueSoonAmount), 0);

  return (
    <Panel title={t('debtsCard.title')} bodyClassName="overflow-hidden p-0">
      <div className="px-4 pt-4 pb-3">
        <p className="font-mono text-3xl leading-tight font-bold tabular-nums break-words md:text-4xl">
          {fmtTJS(debts.totalOutstanding)}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {t('debtsCard.owedBy', { count: debts.activeDebtorCount })}
        </p>
      </div>

      <div className="divide-border border-border divide-y border-t">
        {debts.overdueCount > 0 && (
          <DebtLine
            icon={AlertCircle}
            tone="danger"
            label={t('debtsCard.overdue')}
            hint={t('debtsCard.debtsCount', { count: debts.overdueCount })}
            amount={debts.overdueAmount}
            to={debtsLink(scope, { debtStatus: 'OVERDUE' })}
          />
        )}

        {debts.dueSoonCount > 0 && (
          <DebtLine
            icon={Clock}
            tone="warning"
            label={dueSoonDays ? t('debtsCard.dueSoonDays', { days: dueSoonDays }) : t('debtsCard.dueSoon')}
            hint={t('debtsCard.debtsCount', { count: debts.dueSoonCount })}
            amount={debts.dueSoonAmount}
            to={debtsLink(scope, { debtStatus: 'DUE_SOON' })}
          />
        )}

        {restCount > 0 && (
          <DebtLine
            icon={Hourglass}
            tone="neutral"
            label={t('debtsCard.rest')}
            hint={t('debtsCard.debtsCount', { count: restCount })}
            amount={restAmount}
          />
        )}
      </div>

      <div className="border-border grid gap-2 border-t p-3 sm:grid-cols-2">
        <Button variant="secondary" size="lg" className="w-full" render={<Link to="/debtors?risk=HIGH" />}>
          {t('debtsCard.whoToCall')}
        </Button>
        <Button variant="outline" size="lg" className="w-full" render={<Link to="/debtors" />}>
          {t('debtsCard.allDebtors')}
        </Button>
      </div>
    </Panel>
  );
}
