import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { debtorsApi } from '~/api/debtors';
import { ListGroup, ListRow } from '~/components/shared/ListGroup';
import { fmtNum } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';
import { cn } from '~/lib/utils';

/**
 * Итоги над списком должников: сколько должны всего, сколько из этого просрочено и с кем
 * разбираться сегодня. Считается сервером по всем должникам маркета, а не по странице —
 * цифры не прыгают при листании и фильтрах. Нет данных (офлайн, ни разу не грузилось) — не рисуем.
 */
export function DebtorSummary({ fromPath }: { fromPath: string }) {
  const { t } = useTranslation(['debtors', 'common']);

  const { data } = useQuery({
    queryKey: queryKeys.sub('debtors', 'summary'),
    queryFn: () => debtorsApi.getSummary(),
    staleTime: 30_000,
  });

  const summary = data?.data;
  if (!summary || summary.debtorsWithDebt === 0) return null;

  return (
    <div className="space-y-4">
      <div className="bg-card grid grid-cols-2 divide-x rounded-2xl">
        <div className="space-y-0.5 p-4">
          <p className="text-muted-foreground text-sm">{t('summary.owed')}</p>
          <p className="font-mono text-2xl leading-tight font-semibold">{fmtNum(Math.round(summary.totalDebt))}</p>
          <p className="text-muted-foreground text-sm">{t('summary.debtors', { count: summary.debtorsWithDebt })}</p>
        </div>
        <div className="space-y-0.5 p-4">
          <p className="text-muted-foreground text-sm">{t('summary.overdue')}</p>
          <p
            className={cn(
              'font-mono text-2xl leading-tight font-semibold',
              summary.overdueAmount > 0 ? 'text-destructive' : 'text-muted-foreground'
            )}>
            {fmtNum(Math.round(summary.overdueAmount))}
          </p>
          <p className="text-muted-foreground text-sm">
            {t('summary.overdueDebtors', { count: summary.overdueDebtors })}
          </p>
        </div>
      </div>

      {summary.callToday.length > 0 && (
        <ListGroup title={t('summary.callToday')} footer={t('summary.callTodayHint')}>
          {summary.callToday.map((item) => (
            <ListRow
              key={item.id}
              to={`/debtors/${item.id}`}
              state={{ fromPath, fromName: t('title') }}
              title={<span className="font-medium">{item.name}</span>}
              subtitle={`${t('profile.overdueAmount')} · ${t('profile.daysUnit', { count: item.maxDaysOverdue })}`}
              value={<span className="text-destructive font-mono font-semibold">{fmtNum(item.overdueAmount)}</span>}
            />
          ))}
        </ListGroup>
      )}
    </div>
  );
}
