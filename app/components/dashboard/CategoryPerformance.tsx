import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ComparisonIndicator } from '~/components/dashboard/ComparisonIndicator';
import { Panel } from '~/components/layout/Panel';
import { fmtTJS } from '~/lib/format';
import { cn } from '~/lib/utils';
import type { OverviewCategoryRow } from '~/types/dashboard';

interface CategoryPerformanceProps {
  categories: OverviewCategoryRow[];
  className?: string;
}

/**
 * Which categories carry the period and which are slipping.
 *
 * The bar is share of the largest category, not of total revenue: it exists to
 * rank at a glance, and the exact money is printed next to it anyway. Products
 * without a category are kept as their own row rather than dropped, otherwise
 * the rows would not add up to the revenue shown above.
 */
export function CategoryPerformance({ categories, className }: CategoryPerformanceProps) {
  const { t } = useTranslation('dashboard');

  const visible = categories.slice(0, 8);
  const max = Math.max(...visible.map((row) => Math.abs(row.netRevenue)), 1);

  return (
    <Panel title={t('categories.title')} className={cn('space-y-3', className)}>
      {visible.length === 0 ? (
        <p className="text-muted-foreground py-4 text-sm">{t('categories.empty')}</p>
      ) : (
        visible.map((row) => {
          const label = row.categoryName ?? t('categories.uncategorized');
          const width = `${Math.round((Math.abs(row.netRevenue) / max) * 100)}%`;

          return (
            <div key={row.categoryId ?? 'none'} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                {row.categoryId ? (
                  <Link
                    to={`/products?categoryId=${row.categoryId}`}
                    className="truncate text-sm font-medium hover:underline">
                    {label}
                  </Link>
                ) : (
                  <span className="text-muted-foreground truncate text-sm">{label}</span>
                )}
                <span className="shrink-0 font-mono text-sm">{fmtTJS(row.netRevenue)}</span>
              </div>
              <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                <div className="bg-primary h-full rounded-full" style={{ width }} />
              </div>
              <ComparisonIndicator comparison={row.comparison} />
            </div>
          );
        })
      )}
    </Panel>
  );
}
