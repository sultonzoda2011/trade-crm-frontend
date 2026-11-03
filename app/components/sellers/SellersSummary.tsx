import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { sellersApi } from '~/api/sellers';
import { fmtNum } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';
import { cn } from '~/lib/utils';
import type { SellerPeriod } from '~/types/sellers';

/**
 * Итоги над списком продавцов: сколько должны им сейчас (за всё время, по всем — и по
 * отключённым тоже: деньги им никуда не делись) и сколько продали/заработали за выбранный
 * период. Считается сервером по всему маркету, а не по странице. Нет данных — не рисуем.
 */
export function SellersSummary({ period }: { period: SellerPeriod }) {
  const { t } = useTranslation('sellers');

  const { data } = useQuery({
    queryKey: queryKeys.sub('sellers', 'summary', null, { period, status: 'all' }),
    queryFn: () => sellersApi.getSummary({ period, status: 'all' }),
    staleTime: 30_000,
  });

  const summary = data?.data;
  if (!summary || summary.counts.active + summary.counts.disabled === 0) return null;

  return (
    <div className="space-y-2">
      <div className="bg-card grid grid-cols-2 divide-x rounded-2xl">
        <div className="space-y-0.5 p-4">
          <p className="text-muted-foreground text-sm">{t('summary.toPay')}</p>
          <p
            className={cn(
              'font-mono text-2xl leading-tight font-semibold',
              summary.toPay > 0 ? 'text-success' : 'text-muted-foreground'
            )}>
            {fmtNum(summary.toPay)}
          </p>
          <p className="text-muted-foreground text-sm">{t('summary.toPayCount', { count: summary.toPayCount })}</p>
        </div>
        <div className="space-y-0.5 p-4">
          <p className="text-muted-foreground text-sm">{t('summary.sold', { period: t(`period.${period}Short`) })}</p>
          <p className="font-mono text-2xl leading-tight font-semibold">{fmtNum(summary.sold)}</p>
          <p className="text-muted-foreground text-sm">{t('summary.earned', { amount: fmtNum(summary.earned) })}</p>
        </div>
      </div>
      {summary.overpaid > 0 && (
        <p className="text-warning px-1 text-xs leading-snug">
          {t('summary.overpaid', { amount: fmtNum(summary.overpaid) })}
        </p>
      )}
    </div>
  );
}

/** Счётчики для чипсов статуса — те же данные, тот же запрос, поэтому отдельного сетевого вызова нет. */
export function useSellerCounts(period: SellerPeriod) {
  const { data } = useQuery({
    queryKey: queryKeys.sub('sellers', 'summary', null, { period, status: 'all' }),
    queryFn: () => sellersApi.getSummary({ period, status: 'all' }),
    staleTime: 30_000,
  });
  return data?.data?.counts;
}
