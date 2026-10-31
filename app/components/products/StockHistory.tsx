import { useInfiniteQuery } from '@tanstack/react-query';
import {
  ClipboardCheck,
  PackageMinus,
  PackageOpen,
  PackagePlus,
  ShoppingCart,
  Ban,
  Undo2,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { productsApi } from '~/api/products';
import { ListEmpty, ListGroup, ListRow } from '~/components/shared/ListGroup';
import { Button } from '~/components/ui/button';
import { fmtNum, formatDateShort, formatTime } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';
import { cn } from '~/lib/utils';
import type { ProductUnit, StockMovement, StockMovementType } from '~/types/products';

const PAGE_SIZE = 20;

const MOVEMENT_ICON: Record<StockMovementType, LucideIcon> = {
  OPENING: PackageOpen,
  SALE: ShoppingCart,
  REFUND: Undo2,
  VOID: Ban,
  RESTOCK: PackagePlus,
  WRITE_OFF: PackageMinus,
  ADJUSTMENT: ClipboardCheck,
};

function MovementRow({ movement, unit }: { movement: StockMovement; unit: string }) {
  const { t } = useTranslation('products');
  const Icon = MOVEMENT_ICON[movement.type];
  const up = movement.delta > 0;

  const title =
    movement.type === 'WRITE_OFF' && movement.reason
      ? `${t('movement.WRITE_OFF')} · ${t(`writeOffReason.${movement.reason}`)}`
      : t(`movement.${movement.type}`);

  const details = [
    `${formatDateShort(movement.createdAt)} ${formatTime(movement.createdAt)}`,
    movement.createdBy?.name,
    movement.note,
  ].filter(Boolean);

  return (
    <ListRow
      leading={
        <span
          className={cn(
            'flex size-9 items-center justify-center rounded-full',
            up ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
          )}>
          <Icon className="size-5" />
        </span>
      }
      title={<span className="line-clamp-2 font-medium">{title}</span>}
      subtitle={<span className="line-clamp-2">{details.join(' · ')}</span>}
      to={movement.transactionId ? `/transactions/${movement.transactionId}` : undefined}
      value={
        <span className="flex flex-col items-end">
          <span className={cn('font-mono font-semibold', up ? 'text-success' : 'text-foreground')}>
            {up ? '+' : '−'}
            {fmtNum(Math.abs(movement.delta))} {unit}
          </span>
          <span className="text-muted-foreground text-xs">
            {t('history.balance', { count: fmtNum(movement.balanceAfter) })}
          </span>
        </span>
      }
    />
  );
}

/**
 * Журнал остатка: каждая продажа, возврат, пополнение, списание и пересчёт с остатком после.
 * Здесь видно, куда делся товар — то, что раньше терялось в одном числе «осталось».
 * Грузится страницами, новые сверху. Только ADMIN/OWNER (так же закрыт эндпоинт).
 */
export function StockHistory({ productId, unit }: { productId: string; unit: ProductUnit }) {
  const { t } = useTranslation(['products', 'common']);
  const unitLabel = t(`unit.${unit}`);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: queryKeys.sub('products', 'movements', productId),
    queryFn: ({ pageParam }) => productsApi.getMovements(productId, { page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const meta = last.data?.meta;
      return meta && meta.page < meta.totalPages ? meta.page + 1 : undefined;
    },
    staleTime: 30_000,
  });

  const movements = data?.pages.flatMap((page) => page.data?.data ?? []) ?? [];
  // Первая загрузка — ничего не рисуем: «движений нет» моргнуло бы зря.
  if (isLoading) return null;

  return (
    <ListGroup title={t('history.title')}>
      {movements.length === 0 ? (
        <ListEmpty>{t('history.empty')}</ListEmpty>
      ) : (
        movements.map((m) => <MovementRow key={m.id} movement={m} unit={unitLabel} />)
      )}
      {hasNextPage && (
        <div className="p-2">
          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            loading={isFetchingNextPage}
            onClick={() => void fetchNextPage()}>
            {t('history.loadMore')}
          </Button>
        </div>
      )}
    </ListGroup>
  );
}
