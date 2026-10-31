import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { productsApi } from '~/api/products';
import { Skeleton } from '~/components/ui/skeleton';
import { fmtNum } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';
import { cn } from '~/lib/utils';

interface ProductsSummaryProps {
  /** Тап по «Нет» / «Мало» открывает список с этим фильтром. */
  onFilter: (key: 'health' | 'lowStock', value: string) => void;
}

/**
 * Три цифры склада над списком (считает сервер по ВСЕМ активным товарам, не по странице):
 * сколько товаров, на какую сумму лежит по розничным ценам и сколько на нём можно заработать.
 * Прибыль считается только по товарам с закупочной ценой — остальные честно названы строкой ниже,
 * а не молча принимаются за нулевую себестоимость. Только ADMIN/OWNER (так же закрыт эндпоинт).
 */
export function ProductsSummary({ onFilter }: ProductsSummaryProps) {
  const { t } = useTranslation('products');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.sub('products', 'summary'),
    queryFn: () => productsApi.getSummary(),
    staleTime: 30_000,
  });

  if (isLoading) return <Skeleton className="h-[74px] rounded-2xl" />;
  const summary = data?.data;
  // Нет сети и нет сохранённой копии — лучше промолчать, чем показать нули.
  if (!summary) return null;

  const hasProfit = summary.productsWithoutCost < summary.activeProducts;
  const items = [
    { key: 'products', label: t('summary.products'), value: fmtNum(summary.activeProducts), tone: 'text-foreground' },
    { key: 'stock', label: t('summary.stockValue'), value: fmtNum(summary.stockRetailValue), tone: 'text-foreground' },
    {
      key: 'profit',
      label: t('summary.profit'),
      value: hasProfit ? fmtNum(summary.potentialProfit) : '—',
      tone: summary.potentialProfit >= 0 ? 'text-success' : 'text-destructive',
    },
  ];

  const notes: { key: string; text: string; tone: string; onClick?: () => void }[] = [];
  if (summary.outOfStock > 0) {
    notes.push({
      key: 'out',
      text: t('summary.outOfStock', { count: summary.outOfStock }),
      tone: 'text-destructive',
      onClick: () => onFilter('health', 'OUT_OF_STOCK'),
    });
  }
  if (summary.lowStock > 0) {
    notes.push({
      key: 'low',
      text: t('summary.lowStock', { count: summary.lowStock }),
      tone: 'text-warning',
      onClick: () => onFilter('lowStock', 'true'),
    });
  }
  if (summary.productsWithoutCost > 0) {
    notes.push({
      key: 'nocost',
      text: t('summary.noCost', { count: summary.productsWithoutCost }),
      tone: 'text-muted-foreground',
    });
  }

  return (
    <div className="bg-card overflow-hidden rounded-2xl">
      <dl className="divide-border grid grid-cols-3 divide-x py-3">
        {items.map((item) => (
          <div key={item.key} className="min-w-0 px-3 text-center">
            <dt className="text-muted-foreground truncate text-xs leading-snug">{item.label}</dt>
            <dd className={cn('mt-0.5 truncate text-base leading-snug font-semibold tabular-nums', item.tone)}>
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
      {notes.length > 0 && (
        <div className="border-border flex flex-wrap gap-x-4 gap-y-1 border-t px-4 py-2 text-xs font-medium">
          {notes.map((n) =>
            n.onClick ? (
              <button key={n.key} type="button" onClick={n.onClick} className={cn('active:opacity-60', n.tone)}>
                {n.text}
              </button>
            ) : (
              <span key={n.key} className={n.tone}>
                {n.text}
              </span>
            )
          )}
        </div>
      )}
    </div>
  );
}
