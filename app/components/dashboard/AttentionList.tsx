import { AlertCircle, AlertTriangle, CheckCircle2, ChevronRight, Info } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { DashboardSuccessState } from '~/components/dashboard/DashboardSuccessState';
import { Panel } from '~/components/layout/Panel';
import { Button } from '~/components/ui/button';
import { INSIGHT_SEVERITY_BADGE } from '~/config/analyticsBadges';
import { ATTENTION_VISIBLE } from '~/config/dashboard';
import type { DashboardScope } from '~/lib/dashboard-links';
import { formatInsightParams, insightHref } from '~/lib/insights';
import { cn } from '~/lib/utils';
import type { BusinessInsight, InsightSeverity } from '~/types/analytics';

const SEVERITY_ICON: Record<InsightSeverity, React.ComponentType<{ className?: string }>> = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
};

/**
 * Where the row leads. The debt rules count the picked seller's debts only, so
 * a link into the transaction list has to carry the seller too — otherwise
 * "5 overdue" opens a list of everybody's overdue debts.
 */
function hrefFor(insight: BusinessInsight, scope: DashboardScope): string | undefined {
  const action = insight.action;
  if (!action) return undefined;

  const query = { ...(action.query ?? {}) };
  if (action.route === '/transactions' && scope.sellerId && !query.createdById) {
    query.createdById = scope.sellerId;
  }
  return insightHref({ ...action, query });
}

function AttentionRow({ insight, scope }: { insight: BusinessInsight; scope: DashboardScope }) {
  const { t } = useTranslation('dashboard');
  const Icon = SEVERITY_ICON[insight.severity];
  const href = hrefFor(insight, scope);

  const content = (
    <>
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full border',
          INSIGHT_SEVERITY_BADGE[insight.severity]
        )}>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1 text-base leading-snug">
        {t(insight.messageKey, formatInsightParams(insight.params))}
      </span>
      {href && <ChevronRight className="text-muted-foreground/60 -mr-1 size-4 shrink-0" />}
    </>
  );

  const classes = 'flex min-h-14 items-center gap-3 px-4 py-3';

  return href ? (
    <Link to={href} className={cn(classes, 'active:bg-muted/70 transition-colors')}>
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  );
}

interface AttentionListProps {
  insights: BusinessInsight[];
  scope: DashboardScope;
}

/**
 * "What needs my attention" — only things that call for a decision (critical and
 * warning rules). Good news and neutral notes live next to the numbers they
 * belong to, not in the alert list, so an empty list really means "all calm".
 */
export function AttentionList({ insights, scope }: AttentionListProps) {
  const { t } = useTranslation('dashboard');
  const [expanded, setExpanded] = useState(false);

  if (insights.length === 0) {
    return (
      <Panel title={t('attention.title')} bodyClassName="p-4">
        <DashboardSuccessState title={t('attention.allClear')} size="sm" />
      </Panel>
    );
  }

  const visible = expanded ? insights : insights.slice(0, ATTENTION_VISIBLE);
  const hidden = insights.length - visible.length;

  return (
    <Panel title={t('attention.title')} bodyClassName="overflow-hidden p-0">
      <div className="divide-border divide-y">
        {visible.map((insight) => (
          <AttentionRow key={insight.id} insight={insight} scope={scope} />
        ))}
      </div>

      {(hidden > 0 || expanded) && insights.length > ATTENTION_VISIBLE && (
        <div className="border-border border-t">
          <Button variant="ghost" className="w-full rounded-t-none" onClick={() => setExpanded((value) => !value)}>
            {expanded ? t('attention.showLess') : t('attention.showAll', { count: insights.length })}
          </Button>
        </div>
      )}
    </Panel>
  );
}
