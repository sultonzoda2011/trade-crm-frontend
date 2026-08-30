import { AlertCircle, ChevronRight, Clock, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Panel } from '~/components/layout/Panel';
import { Button } from '~/components/ui/button';
import { fmtTJS } from '~/lib/format';
import { cn } from '~/lib/utils';
import type { OverviewDebts } from '~/types/dashboard';

interface OverdueAlertCardProps {
  debts: OverviewDebts;
  className?: string;
}

/**
 * The debt position as something to act on, not a list of names.
 *
 * The card used to show "top debtors by amount" under an "overdue" heading —
 * the count and the label disagreed. It now reads the same figures the
 * recommendations do and opens the same filtered lists
 * (`debtStatus=OVERDUE`, `debtStatus=DUE_SOON`), so "7 overdue" here and seven
 * rows over there are the same seven debts.
 */
export function OverdueAlertCard({ debts, className }: OverdueAlertCardProps) {
  const { t } = useTranslation('dashboard');

  const hasOverdue = debts.overdueCount > 0;

  return (
    <Panel
      className={cn(hasOverdue && 'border-destructive/20 bg-destructive/5 border', className)}
      bodyClassName="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
              hasOverdue ? 'bg-destructive/10' : 'bg-muted'
            )}>
            {hasOverdue ? (
              <AlertCircle className="text-destructive h-4 w-4" />
            ) : (
              <Wallet className="text-muted-foreground h-4 w-4" />
            )}
          </div>
          <h3 className={cn('truncate text-sm font-semibold', hasOverdue ? 'text-destructive' : undefined)}>
            {t('debts.title')}
          </h3>
        </div>
        <span className="text-muted-foreground shrink-0 text-xs">
          {t('debts.debtors', { count: debts.activeDebtorCount })}
        </span>
      </div>

      <div className="space-y-1.5">
        <Link
          to="/transactions?debtStatus=OVERDUE"
          className={cn(
            'flex items-center justify-between gap-2 rounded-md px-2.5 py-2 transition-colors',
            hasOverdue ? 'bg-destructive/10 hover:bg-destructive/15' : 'bg-muted/50 hover:bg-muted/80'
          )}>
          <span className="flex min-w-0 items-center gap-2">
            <AlertCircle
              className={cn('h-3.5 w-3.5 shrink-0', hasOverdue ? 'text-destructive' : 'text-muted-foreground')}
            />
            <span className="min-w-0 truncate text-sm">{t('debts.overdue', { count: debts.overdueCount })}</span>
          </span>
          <span
            className={cn(
              'shrink-0 font-mono text-sm font-semibold',
              hasOverdue ? 'text-destructive' : 'text-muted-foreground'
            )}>
            {fmtTJS(debts.overdueAmount)}
          </span>
        </Link>

        <Link
          to="/transactions?debtStatus=DUE_SOON"
          className="bg-muted/50 hover:bg-muted/80 flex items-center justify-between gap-2 rounded-md px-2.5 py-2 transition-colors">
          <span className="flex min-w-0 items-center gap-2">
            <Clock className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0 truncate text-sm">{t('debts.dueSoon', { count: debts.dueSoonCount })}</span>
          </span>
          <span
            className={cn(
              'shrink-0 font-mono text-sm font-semibold',
              debts.dueSoonCount > 0 ? 'text-warning' : 'text-muted-foreground'
            )}>
            {fmtTJS(debts.dueSoonAmount)}
          </span>
        </Link>
      </div>

      <div className="border-border grid grid-cols-2 gap-3 border-t pt-3">
        <div>
          <p className="text-muted-foreground text-xs">{t('debts.outstanding')}</p>
          <p className="font-mono text-sm font-semibold">{fmtTJS(debts.totalOutstanding)}</p>
        </div>
        <div>
          {/* The one period-scoped figure here — labelled as such. */}
          <p className="text-muted-foreground text-xs">{t('debts.collected')}</p>
          <p className={cn('font-mono text-sm font-semibold', debts.collectedAmount > 0 && 'text-success')}>
            {fmtTJS(debts.collectedAmount)}
          </p>
        </div>
      </div>

      <Button variant="ghost" size="sm" className="w-full gap-1 text-xs" render={<Link to="/debtors?risk=HIGH" />}>
        {t('debts.whoToCall')} <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </Panel>
  );
}
