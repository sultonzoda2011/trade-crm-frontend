import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { ComparisonIndicator } from '~/components/dashboard/ComparisonIndicator';
import { Panel } from '~/components/layout/Panel';
import { fmtTJS } from '~/lib/format';
import type { OverviewCategoryRow } from '~/types/dashboard';

interface CategoryPerformanceProps {
  categories: OverviewCategoryRow[];
  className?: string;
}

export function CategoryPerformance({ categories, className }: CategoryPerformanceProps) {
  const { t } = useTranslation('dashboard');

  const visible = categories.slice(0, 8);

  const max = Math.max(...visible.map((row) => Math.abs(row.netRevenue)), 1);

  return (
    <Panel
      title={t('categories.title')}
      className={`h-full min-h-0 ${className ?? ''}`}
      bodyClassName="flex min-h-0 flex-1 flex-col gap-[clamp(0.625rem,1vw,0.875rem)]">
      {visible.length === 0 ? (
        <div className="flex flex-1 items-center">
          <p className="text-muted-foreground py-4 text-sm">{t('categories.empty')}</p>
        </div>
      ) : (
        <div className="min-w-0 space-y-[clamp(0.625rem,1vw,0.875rem)]">
          {visible.map((row) => {
            const label = row.categoryName ?? t('categories.uncategorized');

            const width = `${Math.round((Math.abs(row.netRevenue) / max) * 100)}%`;

            return (
              <div key={row.categoryId ?? 'none'} className="min-w-0 space-y-1.5">
                <div className="flex min-w-0 items-baseline justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {row.categoryId ? (
                      <Link
                        to={`/products?categoryId=${row.categoryId}`}
                        className="block truncate text-sm font-medium hover:underline">
                        {label}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground block truncate text-sm">{label}</span>
                    )}
                  </div>

                  <span className="shrink-0 font-mono text-sm whitespace-nowrap">{fmtTJS(row.netRevenue)}</span>
                </div>

                <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                  <div className="bg-primary h-full rounded-full transition-[width]" style={{ width }} />
                </div>

                <ComparisonIndicator comparison={row.comparison} />
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
