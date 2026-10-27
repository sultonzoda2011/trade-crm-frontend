import { useInfiniteQuery } from '@tanstack/react-query';
import { Banknote, HandCoins } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { debtorsApi } from '~/api/debtors';
import { ListEmpty, ListGroup, ListRow } from '~/components/shared/ListGroup';
import { Button } from '~/components/ui/button';
import { fmtNum, fmtTJS, formatDateShort, formatTime } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';
import { cn } from '~/lib/utils';
import type { DebtorLedgerEvent } from '~/types/debtors';

const PAGE_SIZE = 20;

function LedgerRow({ event }: { event: DebtorLedgerEvent }) {
  const { t } = useTranslation('debtors');
  const isDebt = event.type === 'DEBT';

  const title = isDebt ? event.itemNames.join(', ') || t('ledger.debt') : t('ledger.payment');
  const details = [
    `${formatDateShort(event.at)} ${formatTime(event.at)}`,
    isDebt && event.dueDate ? t('ledger.due', { date: formatDateShort(event.dueDate) }) : null,
    event.createdByName,
    event.note,
  ].filter(Boolean);

  return (
    <ListRow
      leading={
        <span
          className={cn(
            'flex size-9 items-center justify-center rounded-full',
            isDebt ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success'
          )}>
          {isDebt ? <HandCoins className="size-5" /> : <Banknote className="size-5" />}
        </span>
      }
      title={<span className="line-clamp-2 font-medium">{title}</span>}
      subtitle={details.join(' · ')}
      to={isDebt ? `/transactions/${event.transactionId}` : undefined}
      value={
        <span className="flex flex-col items-end">
          <span className={cn('font-mono font-semibold', isDebt ? 'text-foreground' : 'text-success')}>
            {isDebt ? '+' : '−'}
            {fmtNum(event.amount)}
          </span>
          <span className="text-muted-foreground text-xs">
            {t('ledger.balance', { amount: fmtTJS(event.balanceAfter) })}
          </span>
        </span>
      }
    />
  );
}

/**
 * Лента должника: выдачи и оплаты подряд с остатком после каждой — то, что раньше было строкой
 * бумажной тетради. Грузится страницами, новые сверху.
 */
export function DebtorLedger({ debtorId }: { debtorId: string }) {
  const { t } = useTranslation(['debtors', 'common']);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: queryKeys.sub('debtors', 'ledger', debtorId),
    queryFn: ({ pageParam }) => debtorsApi.getLedger(debtorId, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const meta = last.data?.meta;
      return meta && meta.page < meta.totalPages ? meta.page + 1 : undefined;
    },
    staleTime: 30_000,
  });

  const events = data?.pages.flatMap((page) => page.data?.data ?? []) ?? [];
  // Пока грузится первый раз — ничего не рисуем: пустая плашка «операций нет» моргнула бы зря.
  if (isLoading) return null;

  return (
    <ListGroup title={t('ledger.title')}>
      {events.length === 0 ? (
        <ListEmpty>{t('ledger.empty')}</ListEmpty>
      ) : (
        events.map((event) => <LedgerRow key={`${event.type}-${event.id}`} event={event} />)
      )}
      {hasNextPage && (
        <div className="p-2">
          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            loading={isFetchingNextPage}
            onClick={() => void fetchNextPage()}>
            {t('ledger.showMore')}
          </Button>
        </div>
      )}
    </ListGroup>
  );
}
