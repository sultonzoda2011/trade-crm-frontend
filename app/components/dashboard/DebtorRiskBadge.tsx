import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '~/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { DEBTOR_RISK_BADGE } from '~/config/analyticsBadges';
import { cn } from '~/lib/utils';
import type { DebtorRisk } from '~/types/analytics';

const RISK_ICON: Record<DebtorRisk, React.ComponentType<{ className?: string }>> = {
  HIGH: AlertCircle,
  MEDIUM: AlertTriangle,
  LOW: CheckCircle2,
};

interface DebtorRiskBadgeProps {
  risk: DebtorRisk;
  /** Factor keys behind the score — shown as the tooltip explanation. */
  factors?: string[];
  className?: string;
}

/**
 * Renders the repayment risk computed by the backend.
 *
 * The badge deliberately does no scoring of its own: the rule lives in one
 * place (backend `scoreDebtorRisk`), so the list, the detail page and the
 * dashboard can never disagree about who is risky. The tooltip turns the
 * factor keys into readable reasons — a risk level nobody can explain is
 * a number the owner will not act on.
 */
export function DebtorRiskBadge({ risk, factors, className }: DebtorRiskBadgeProps) {
  const { t } = useTranslation('debtors');
  const Icon = RISK_ICON[risk];

  const badge = (
    <Badge variant="outline" className={cn('gap-1', DEBTOR_RISK_BADGE[risk], className)}>
      <Icon className="h-3.5 w-3.5" />
      {t(`risk.${risk}`)}
    </Badge>
  );

  if (!factors?.length) return badge;

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>{badge}</TooltipTrigger>
      <TooltipContent className="max-w-64">
        <p className="mb-1 font-medium">{t('risk.whyTitle')}</p>
        <ul className="list-inside list-disc space-y-0.5">
          {factors.map((factor) => (
            <li key={factor}>{t(`riskFactors.${factor}`)}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}
