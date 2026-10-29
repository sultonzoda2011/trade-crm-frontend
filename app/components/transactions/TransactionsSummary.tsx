import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { transactionsApi } from '~/api/transactions';
import { Skeleton } from '~/components/ui/skeleton';
import { fmtNum } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';
import { cn } from '~/lib/utils';
import type { ActiveFilter } from '~/types/filters';

interface TransactionsSummaryProps {
  filters: ActiveFilter[];
  search: string;
}

/**
 * Три цифры над списком — по тем же фильтрам и поиску, что и сам список, и по всем страницам, а не
 * только по загруженной (считает сервер, `GET /transactions/summary`; доступно и продавцу):
 *  - Продано — продажи и выданное в долг за вычетом возвратов;
 *  - В долг — сколько из этого ещё не оплачено;
 *  - Возвраты — сумма возвратов.
 */
export function TransactionsSummary({ filters, search }: TransactionsSummaryProps) {
  const { t } = useTranslation('transactions');
  // Сортировка на итоги не влияет — не даём ей плодить отдельные запросы.
  const summaryFilters = filters.filter((f) => f.key !== 'sortBy' && f.key !== 'sortOrder');
  const options = { search: search || undefined };

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.sub('transactions', 'summary', null, { filters: summaryFilters, ...options }),
    queryFn: () => transactionsApi.getSummary(options, summaryFilters),
    staleTime: 30_000,
  });

  if (isLoading) return <Skeleton className="h-[74px] rounded-2xl" />;
  const summary = data?.data;
  // Нет сети и нет сохранённой копии — лучше промолчать, чем показать нули.
  if (!summary) return null;

  const items = [
    { key: 'sold', label: t('list.summary.sold'), value: summary.netAmount, tone: 'text-foreground' },
    { key: 'debt', label: t('list.summary.debt'), value: summary.debts.remaining, tone: 'text-warning' },
    { key: 'refunds', label: t('list.summary.refunds'), value: summary.refunds.amount, tone: 'text-destructive' },
  ];

  return (
    <dl className="bg-card divide-border grid grid-cols-3 divide-x rounded-2xl py-3">
      {items.map((item) => (
        <div key={item.key} className="min-w-0 px-3 text-center">
          <dt className="text-muted-foreground truncate text-xs leading-snug">{item.label}</dt>
          <dd
            className={cn(
              'mt-0.5 truncate text-base leading-snug font-semibold tabular-nums',
              item.value !== 0 ? item.tone : 'text-muted-foreground'
            )}>
            {fmtNum(item.value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
