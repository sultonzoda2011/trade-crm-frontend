import { TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Panel } from '~/components/layout/Panel';
import { CATEGORY_CHANGES_VISIBLE, SIGNIFICANT_CHANGE_PERCENT } from '~/config/dashboard';
import type { Period } from '~/config/period';
import { fmtTJS } from '~/lib/format';
import { cn } from '~/lib/utils';
import type { OverviewCategoryRow } from '~/types/dashboard';

interface SalesChangesProps {
  categories: OverviewCategoryRow[];
  period: Period;
}

/**
 * Which categories sell noticeably better or worse than in the previous period.
 *
 * Only categories are compared: the backend gives a previous-period figure per
 * category but not per product, so a product-level "sells worse than usual"
 * cannot be shown without inventing it. A category needs a non-zero previous
 * period (`changePercent !== null`) — growth from nothing has no percentage —
 * and a change of at least `SIGNIFICANT_CHANGE_PERCENT`, below which it is noise.
 * The biggest money movers come first.
 */
export function SalesChanges({ categories, period }: SalesChangesProps) {
  const { t } = useTranslation('dashboard');

  const { rows, comparable } = useMemo(() => {
    const withBaseline = categories.filter((row) => row.comparison.changePercent !== null);
    const significant = withBaseline
      .filter((row) => Math.abs(row.comparison.changePercent ?? 0) >= SIGNIFICANT_CHANGE_PERCENT)
      .sort((a, b) => Math.abs(b.comparison.difference) - Math.abs(a.comparison.difference))
      .slice(0, CATEGORY_CHANGES_VISIBLE);
    return { rows: significant, comparable: withBaseline.length };
  }, [categories]);

  return (
    <Panel title={t('changes.title')} bodyClassName="overflow-hidden p-0">
      <p className="text-muted-foreground px-4 pt-3 pb-2 text-sm leading-snug">{t(`changes.basis.${period}`)}</p>

      {rows.length === 0 ? (
        <p className="text-muted-foreground border-border border-t px-4 py-4 text-sm leading-snug">
          {comparable === 0 ? t('changes.noBaseline') : t('changes.steady')}
        </p>
      ) : (
        <div className="divide-border border-border divide-y border-t">
          {rows.map((row) => {
            const { changePercent, previous, current } = row.comparison;
            const up = (changePercent ?? 0) > 0;
            const Icon = up ? TrendingUp : TrendingDown;
            const name = row.categoryName ?? t('categories.uncategorized');

            const content = (
              <>
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full',
                    up ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                  )}>
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base leading-snug font-semibold break-words">{name}</span>
                  <span className="text-muted-foreground block text-sm leading-snug">
                    {t('changes.wasNow', { previous: fmtTJS(previous), current: fmtTJS(current) })}
                  </span>
                </span>
                <span className={cn('shrink-0 font-mono text-base font-semibold tabular-nums', up ? 'text-success' : 'text-destructive')}>
                  {up ? '+' : ''}
                  {changePercent}%
                </span>
              </>
            );

            const classes = 'flex min-h-14 items-center gap-3 px-4 py-2.5';

            return row.categoryId ? (
              <Link
                key={row.categoryId}
                to={`/products?categoryId=${row.categoryId}`}
                className={cn(classes, 'active:bg-muted/70 transition-colors')}>
                {content}
              </Link>
            ) : (
              <div key="none" className={classes}>
                {content}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
