import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { sellersApi } from '~/api/sellers';
import { ListEmpty, ListGroup, ListRow } from '~/components/shared/ListGroup';
import { Button } from '~/components/ui/button';
import { fmtNum, formatDate } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';
import { cn } from '~/lib/utils';
import { useSellersModals } from '~/routes/(crm)/sellers/store';
import type { EarningsEntry, SellerEarnings, SellerEarningsResponse } from '~/types/sellers';

const PAGE_SIZE = 20;
/** Долг, по которому ещё не всё оплачено: надбавка уже записана, но живых денег под ней нет. */
const OPEN_DEBT = ['ACTIVE', 'PARTIAL'];

interface EarningsFeedProps {
  seller: { id: string; name: string };
  /** Первая страница уже пришла с карточкой — отдельный запрос не нужен. */
  initial?: SellerEarnings;
  /** Можно ли отменять выплаты (право + роль). */
  canReverse: boolean;
  fromState: unknown;
}

function signed(amount: number): string {
  return `${amount < 0 ? '−' : '+'}${fmtNum(Math.abs(amount))}`;
}

/**
 * Лента «из чего сложился баланс»: надбавки с продаж, возвраты, выплаты и отмены выплат подряд,
 * новые сверху. Сумма всех строк ленты равна балансу — поэтому каждая строка показывает своё
 * влияние на него со знаком. Ошибочную выплату можно отменить тапом по ней.
 */
export function EarningsFeed({ seller, initial, canReverse, fromState }: EarningsFeedProps) {
  const { t } = useTranslation(['sellers', 'common']);
  const reverseModal = useSellersModals((s) => s.reverse);

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: queryKeys.sub('sellers', 'earnings', seller.id),
    queryFn: ({ pageParam }) => sellersApi.getEarnings(seller.id, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const meta = last.data?.entries?.meta;
      return meta && meta.page < meta.totalPages ? meta.page + 1 : undefined;
    },
    // Первая страница ленты уже приехала с карточкой; обёртку ответа достраиваем, остальное тянется как обычно.
    initialData: initial ? { pages: [{ data: initial } as SellerEarningsResponse], pageParams: [1] } : undefined,
    staleTime: 30_000,
  });

  const entries = data?.pages.flatMap((page) => page.data?.entries?.data ?? []) ?? [];

  const renderRow = (entry: EarningsEntry) => {
    const date = formatDate(entry.at, true);
    const isPayout = entry.kind === 'PAYOUT';
    const reversed = isPayout && !!entry.reversedById;
    const reversible = isPayout && !reversed && canReverse;

    const title =
      entry.kind === 'EARNED'
        ? t('feed.earned')
        : entry.kind === 'REFUNDED'
          ? t('feed.refunded')
          : entry.kind === 'PAYOUT'
            ? t('feed.payout')
            : t('feed.reversal');

    const details = [
      entry.counterparty,
      entry.kind === 'EARNED' && entry.transactionType === 'DEBT' && OPEN_DEBT.includes(entry.transactionStatus ?? '')
        ? t('feed.inDebt')
        : null,
      entry.note,
      entry.byName,
      date,
    ].filter(Boolean);

    const amountClass =
      entry.kind === 'EARNED'
        ? 'text-success'
        : entry.kind === 'REFUNDED'
          ? 'text-destructive'
          : entry.kind === 'PAYOUT_REVERSAL'
            ? 'text-warning'
            : 'text-foreground';

    return (
      <ListRow
        key={entry.id}
        title={
          <span className={cn('font-medium', reversed && 'text-muted-foreground line-through')}>
            {title}
            {reversed && (
              <span className="text-muted-foreground ml-2 text-xs font-normal no-underline">{t('feed.reversed')}</span>
            )}
          </span>
        }
        subtitle={details.join(' · ')}
        value={signed(entry.amount)}
        valueClassName={cn('font-mono font-semibold', amountClass, reversed && 'text-muted-foreground line-through')}
        to={entry.kind === 'EARNED' || entry.kind === 'REFUNDED' ? `/transactions/${entry.transactionId}` : undefined}
        state={fromState}
        onClick={
          reversible
            ? () => reverseModal.open({ seller, credit: { id: entry.id, amount: Math.abs(entry.amount) } })
            : undefined
        }
      />
    );
  };

  return (
    <ListGroup
      title={t('feed.title')}
      footer={
        canReverse && entries.some((e) => e.kind === 'PAYOUT' && !e.reversedById) ? t('feed.reverseHint') : undefined
      }>
      {entries.length === 0 ? <ListEmpty>{t('feed.empty')}</ListEmpty> : entries.map(renderRow)}
      {hasNextPage && (
        <div className="p-2">
          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            loading={isFetchingNextPage}
            onClick={() => void fetchNextPage()}>
            {t('feed.showMore')}
          </Button>
        </div>
      )}
    </ListGroup>
  );
}
