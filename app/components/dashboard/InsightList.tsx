import { AlertCircle, AlertTriangle, ArrowRight, CheckCircle2, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Panel } from '~/components/layout/Panel';
import { Button } from '~/components/ui/button';
import { INSIGHT_SEVERITY_ACCENT, INSIGHT_SEVERITY_BADGE } from '~/config/analyticsBadges';
import { fmtTJS } from '~/lib/format';
import { cn } from '~/lib/utils';
import type { BusinessInsight, InsightSeverity } from '~/types/analytics';

const SEVERITY_ICON: Record<InsightSeverity, React.ComponentType<{ className?: string }>> = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
};

/** Params named like money are rendered as money; the rest stay as they are. */
const MONEY_PARAMS = new Set(['amount', 'previous', 'value']);

function formatParams(params: Record<string, string | number>): Record<string, string | number> {
  const formatted: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    formatted[key] = MONEY_PARAMS.has(key) && typeof value === 'number' ? fmtTJS(value) : value;
  }
  return formatted;
}

/**
 * Turns a backend recommendation into a link to the screen where the user can
 * act on it. The route and its filters come from the backend `action` — the
 * same rule that counted the problem decides where the user lands, so the
 * number in the sentence always matches the list that opens.
 */
function insightHref(action: NonNullable<BusinessInsight['action']>): string {
  const query = new URLSearchParams(action.query ?? {}).toString();
  return query ? `${action.route}?${query}` : action.route;
}

function InsightRow({ insight }: { insight: BusinessInsight }) {
  const { t } = useTranslation('dashboard');
  const Icon = SEVERITY_ICON[insight.severity];

  return (
    <div
      className={cn(
        'flex items-start gap-3 border-l-2 py-3 pl-3',
        INSIGHT_SEVERITY_ACCENT[insight.severity]
      )}>
      <span
        className={cn(
          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border',
          INSIGHT_SEVERITY_BADGE[insight.severity]
        )}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">{t(insight.messageKey, formatParams(insight.params))}</p>
      </div>
      {insight.action && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 gap-1 text-xs"
          render={<Link to={insightHref(insight.action)} />}>
          <span className="hidden sm:inline">{t('insights.open')}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

interface InsightListProps {
  insights: BusinessInsight[];
  className?: string;
}

/**
 * "What needs my attention today" — the answer the dashboard exists to give.
 *
 * An empty list is a real answer, not an empty state to apologise for: it
 * means no rule fired, so nothing is on fire.
 */
export function InsightList({ insights, className }: InsightListProps) {
  const { t } = useTranslation('dashboard');

  return (
    <Panel title={t('insights.title')} className={cn('p-0', className)}>
      {insights.length === 0 ? (
        <div className="text-muted-foreground flex items-center gap-2 px-4 py-6 text-sm">
          <CheckCircle2 className="text-success h-4 w-4 shrink-0" />
          {t('insights.allClear')}
        </div>
      ) : (
        <div className="divide-border divide-y px-4">
          {insights.map((insight) => (
            <InsightRow key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </Panel>
  );
}
