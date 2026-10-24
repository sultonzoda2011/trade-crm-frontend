import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { dashboardApi } from '~/api/dashboard';
import { Skeleton } from '~/components/ui/skeleton';
import type { Period } from '~/config/period';
import { fmtNum } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';
import { cn } from '~/lib/utils';

/**
 * Три цифры за выбранный период — те же, что на «Обзоре» дашборда (тот же запрос
 * и тот же кеш), поэтому «Продано» здесь и там не расходится:
 *  - Продано — наличные и карта за вычетом возвратов плюс товар, отданный в долг;
 *  - В долг — часть «Продано», за которую ещё не заплатили;
 *  - Возвраты — сумма возвратов.
 * Сервер считает их по периоду целиком, а не по загруженной странице списка.
 */
export function TransactionsSummary({ period }: { period: Exclude<Period, 'year'> }) {
  const { t } = useTranslation('transactions');
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.dashboard('overview', { period }),
    queryFn: () => dashboardApi.getOverview({ period }),
    staleTime: 30_000,
  });

  if (isLoading) return <Skeleton className="h-[74px] rounded-2xl" />;
  const overview = data?.data;
  // Нет сети и нет сохранённой копии — лучше промолчать, чем показать нули.
  if (!overview) return null;

  const items = [
    { key: 'sold', label: t('list.summary.sold'), value: overview.sales.netRevenue, tone: 'text-foreground' },
    { key: 'debt', label: t('list.summary.debt'), value: overview.sales.debtIssued, tone: 'text-warning' },
    { key: 'refunds', label: t('list.summary.refunds'), value: overview.returns.amount, tone: 'text-destructive' },
  ];

  return (
    <dl className="bg-card divide-border grid grid-cols-3 divide-x rounded-2xl py-3">
      {items.map((item) => (
        <div key={item.key} className="min-w-0 px-3 text-center">
          <dt className="text-muted-foreground truncate text-xs leading-snug">{item.label}</dt>
          <dd
            className={cn(
              'mt-0.5 truncate text-base leading-snug font-semibold tabular-nums',
              item.value > 0 ? item.tone : 'text-muted-foreground'
            )}>
            {fmtNum(item.value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
