import { useQuery } from '@tanstack/react-query';
import { PackageOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { categoriesApi } from '~/api/categories';
import { Skeleton } from '~/components/ui/skeleton';
import { fmtNum } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';

/**
 * Шапка экрана «Категории»: сколько категорий и товаров и на какую сумму лежит остаток
 * (по розничным ценам, считает сервер по ВСЕМ активным товарам, не по странице).
 * Ниже — строка «Без категории», если такие товары есть: тап открывает их список,
 * чтобы разложить по местам. Только ADMIN/OWNER — так же закрыт эндпоинт.
 */
export function CategoriesSummary() {
  const { t } = useTranslation('categories');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.sub('categories', 'summary'),
    queryFn: () => categoriesApi.getSummary(),
    staleTime: 30_000,
  });

  if (isLoading) return <Skeleton className="h-[74px] rounded-2xl" />;
  const summary = data?.data;
  // Нет сети и нет сохранённой копии — лучше промолчать, чем показать нули.
  if (!summary) return null;

  const items = [
    { key: 'categories', label: t('summary.categories'), value: fmtNum(summary.categories) },
    { key: 'products', label: t('summary.products'), value: fmtNum(summary.products) },
    { key: 'stock', label: t('summary.stockValue'), value: fmtNum(summary.stockValue) },
  ];

  return (
    <div className="bg-card overflow-hidden rounded-2xl">
      <dl className="divide-border grid grid-cols-3 divide-x py-3">
        {items.map((item) => (
          <div key={item.key} className="min-w-0 px-3 text-center">
            <dt className="text-muted-foreground truncate text-xs leading-snug">{item.label}</dt>
            <dd className="mt-0.5 truncate text-base leading-snug font-semibold tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
      {summary.uncategorizedProducts > 0 && (
        <Link
          to="/products"
          state={{ fromUncategorized: true }}
          className="border-border active:bg-muted/70 flex min-h-12 items-center gap-3 border-t px-4 py-2.5 transition-colors">
          <span className="bg-warning/15 text-warning flex size-8 shrink-0 items-center justify-center rounded-lg">
            <PackageOpen className="size-4" strokeWidth={1.9} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base leading-snug font-medium">{t('uncategorized.title')}</span>
            <span className="text-muted-foreground block text-sm leading-snug">
              {t('uncategorized.subtitle', {
                count: summary.uncategorizedProducts,
                value: fmtNum(summary.uncategorizedValue),
              })}
            </span>
          </span>
          <span className="text-muted-foreground/50 text-xl leading-none">›</span>
        </Link>
      )}
    </div>
  );
}
