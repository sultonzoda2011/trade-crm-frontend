import { AlertCircle, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Panel } from '~/components/layout/Panel';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { fmtTJS } from '~/lib/format';
import dayjs from 'dayjs';
import type { DashboardTopDebtor } from '~/types/dashboard';

interface OverdueAlertCardProps {
  debtors: DashboardTopDebtor[];
  totalOverdueAmount?: number;
}

export function OverdueAlertCard({ debtors, totalOverdueAmount = 0 }: OverdueAlertCardProps) {
  const { t } = useTranslation(['dashboard', 'common']);

  // Filter for overdue - this would need dueDate comparison on backend
  // For now, showing high-priority debtors
  const overdueDebtors = debtors.slice(0, 3);

  if (overdueDebtors.length === 0) {
    return null;
  }

  return (
    <Panel className="border-destructive/20 bg-destructive/5">
      <div className="flex items-start gap-3">
        <div className="bg-destructive/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <AlertCircle className="text-destructive h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-3">
            <h3 className="text-destructive font-semibold">{t('overdueAlerts')}</h3>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {overdueDebtors.length} {t('activeOverdueDebts')}
            </p>
          </div>

          <div className="space-y-2">
            {overdueDebtors.map((debtor) => (
              <Link
                key={debtor.id}
                to={`/debtors/${debtor.id}`}
                className="bg-destructive/10 hover:bg-destructive/15 flex items-center justify-between gap-2 rounded-md p-2.5 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{debtor.name}</p>
                </div>
                <span className="text-destructive shrink-0 font-mono text-sm font-bold">
                  {fmtTJS(debtor.totalDebt)}
                </span>
              </Link>
            ))}
          </div>

          {totalOverdueAmount > 0 && (
            <div className="border-destructive/10 mt-3 border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('totalOverdue')}</span>
                <span className="text-destructive font-mono text-sm font-bold">{fmtTJS(totalOverdueAmount)}</span>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full gap-1 text-xs"
            render={<Link to="/debtors?filter=overdue" />}>
            {t('viewAll')} <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Panel>
  );
}
