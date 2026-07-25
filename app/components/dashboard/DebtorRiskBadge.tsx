import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '~/components/ui/badge';
import dayjs from 'dayjs';

interface DebtorRiskBadgeProps {
  debtorName: string;
  totalDebt: number;
  dueDate?: string;
  activeTransactions: number;
  overdueCount?: number;
}

export type RiskLevel = 'critical' | 'warning' | 'healthy';

export function calculateRiskLevel(dueDate?: string, totalDebt?: number, overdueCount?: number): RiskLevel {
  // If no due date, can't determine risk
  if (!dueDate) return 'healthy';

  const daysOverdue = dayjs().diff(dayjs(dueDate), 'days');

  // Critical: more than 30 days overdue or has overdue debts
  if (daysOverdue > 30 || (overdueCount && overdueCount > 0)) {
    return 'critical';
  }

  // Warning: 7-30 days overdue
  if (daysOverdue > 7) {
    return 'warning';
  }

  // Healthy: all good
  return 'healthy';
}

export function DebtorRiskBadge({
  debtorName,
  totalDebt,
  dueDate,
  activeTransactions,
  overdueCount,
}: DebtorRiskBadgeProps) {
  const riskLevel = calculateRiskLevel(dueDate, totalDebt, overdueCount);

  const iconProps = { className: 'h-3.5 w-3.5' };

  if (riskLevel === 'critical') {
    return (
      <Badge className="gap-1 border-destructive/40 bg-destructive/15 text-destructive" variant="outline">
        <AlertCircle {...iconProps} />
        Critical
      </Badge>
    );
  }

  if (riskLevel === 'warning') {
    return (
      <Badge className="gap-1 border-warning/40 bg-warning/15 text-warning" variant="outline">
        <AlertTriangle {...iconProps} />
        Warning
      </Badge>
    );
  }

  return (
    <Badge className="gap-1 border-success/40 bg-success/15 text-success" variant="outline">
      <CheckCircle2 {...iconProps} />
      Healthy
    </Badge>
  );
}

// Simplified version for list views
interface SimpleRiskBadgeProps {
  totalDebt: number;
  activeTransactions: number;
}

export function SimpleRiskBadge({ totalDebt, activeTransactions }: SimpleRiskBadgeProps) {
  // Simple risk indicator based on number of active transactions
  if (activeTransactions > 5) {
    return (
      <Badge className="gap-1 border-destructive/40 bg-destructive/15 text-destructive" variant="outline">
        <AlertCircle className="h-3 w-3" />
        High Risk
      </Badge>
    );
  }

  if (activeTransactions > 2) {
    return (
      <Badge className="gap-1 border-warning/40 bg-warning/15 text-warning" variant="outline">
        <AlertTriangle className="h-3 w-3" />
        Medium Risk
      </Badge>
    );
  }

  return (
    <Badge className="gap-1 border-success/40 bg-success/15 text-success" variant="outline">
      <CheckCircle2 className="h-3 w-3" />
      Low Risk
    </Badge>
  );
}
