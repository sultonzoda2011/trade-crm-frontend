import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { ComparisonIndicator } from '~/components/dashboard/ComparisonIndicator';
import { Panel } from '~/components/layout/Panel';
import { CATEGORIES_VISIBLE } from '~/config/dashboard';
import type { Period } from '~/config/period';
import { fmtTJS } from '~/lib/format';
import type { OverviewCategoryRow } from '~/types/dashboard';

interface CategoryBreakdownProps {
  categories: OverviewCategoryRow[];
  period: Period;
  /** The window is long enough to compare with the previous one. */
  comparable: boolean;
  /** Net revenue of the whole period (same scope), to say what share each category is. */
  totalRevenue: number;
}

/**
 * Where the money came from, by groups of goods.
 */
export function CategoryBreakdown({ categories, period, comparable, totalRevenue }: CategoryBreakdownProps) {
  const { t } = useTranslation('dashboard');
  const [expanded, setExpanded] = useState(false);

  const rows = expanded ? categories : categories.slice(0, CATEGORIES_VISIBLE);
  const hidden = categories.length - CATEGORIES_VISIBLE;
  const max = Math.max(...categories.map((row) => Math.abs(row.netRevenue)), 1);

  return (
    <Panel title={t('categoryCard.title')} bodyClassName="overflow-hidden p-0">
      <p className="text-muted-foreground px-4 pt-3 pb-2 text-sm leading-snug">
        {comparable ? t('categoryCard.hint', { vs: t(`summary.vs.${period}`) }) : t('categoryCard.noCompare')}
      </p>

      {categories.length === 0 ? (
        <p className="text-muted-foreground border-border border-t px-4 py-4 text-sm leading-snug">{t('categories.empty')}</p>
      ) : (
        <div className="divide-border border-border divide-y border-t">
          {rows.map((row) => {
            const name = row.categoryName ?? t('categories.uncategorized');
            const share = totalRevenue > 0 ? (row.netRevenue / totalRevenue) * 100 : null;
            const width = `${Math.round((Math.abs(row.netRevenue) / max) * 100)}%`;
            const { previous, current } = row.comparison;

            const body = (
              <span className="flex items-start gap-3">
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 text-base leading-snug font-medium break-words">{name}</span>
                    <span className="shrink-0 font-mono text-base font-medium tabular-nums">{fmtTJS(row.netRevenue)}</span>
                  </span>
                  <span className="bg-muted mt-2 block h-1 w-full overflow-hidden rounded-full">
                    <span className="bg-primary block h-full rounded-full" style={{ width }} />
                  </span>
                  <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm leading-snug">
                    {share !== null && (
                      <span className="text-muted-foreground tabular-nums">
                        {share < 1 ? t('categoryCard.shareLow') : t('categoryCard.share', { percent: Math.round(share) })}
                      </span>
                    )}
                    {comparable &&
                      (previous > 0 ? (
                        <ComparisonIndicator comparison={row.comparison} className="text-sm" />
                      ) : (
                        current > 0 && <span className="text-muted-foreground">{t('categoryCard.noPrevious')}</span>
                      ))}
                  </span>
                </span>
                {row.categoryId && (
                  <ChevronRight className="text-muted-foreground/60 mt-1 -mr-1 size-4 shrink-0" strokeWidth={1.5} />
                )}
              </span>
            );

            return row.categoryId ? (
              <Link
                key={row.categoryId}
                to={`/products?categoryId=${row.categoryId}`}
                className="active:bg-muted/70 block px-4 py-3 transition-colors">
                {body}
              </Link>
            ) : (
              <div key="none" className="block px-4 py-3">
                {body}
              </div>
            );
          })}
        </div>
      )}

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="text-primary border-border flex min-h-12 w-full items-center justify-center gap-1 border-t px-4 text-base font-medium active:opacity-60">
          {expanded ? t('categoryCard.showLess') : t('categoryCard.showAll', { count: categories.length })}
          {expanded ? <ChevronUp className="size-4" strokeWidth={1.5} /> : <ChevronDown className="size-4" strokeWidth={1.5} />}
        </button>
      )}
    </Panel>
  );
}
