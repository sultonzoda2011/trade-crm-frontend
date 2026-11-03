import type { Row } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { EntityAvatar } from '~/components/shared/EntityAvatar';
import { SellerStatusBadge } from '~/components/sellers/SellerStatusBadge';
import { fmtNum } from '~/lib/format';
import { cn } from '~/lib/utils';
import type { Seller } from '~/types/sellers';

/**
 * Строка продавца: имя и «продал за период» слева, справа — сколько ему должны (главное
 * для владельца) и сколько заработал за период. Переплата (баланс < 0) — жёлтым с подписью,
 * чтобы не принять минус за ошибку отображения. Отключённый — приглушён, со значком.
 */
export function SellerMobileCard({ row, t }: { row: Row<Seller>; t: TFunction }) {
  const s = row.original;
  const stats = s.stats;
  const balance = stats?.balance ?? 0;

  return (
    <div className={cn('flex items-center gap-3 px-4 py-3', !s.isActive && 'opacity-70')}>
      <EntityAvatar name={s.name} image={s.image} size="md" />

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-base leading-snug font-semibold">{s.name}</p>
        <p className="text-muted-foreground text-sm leading-snug">
          {stats ? (stats.salesCount > 0 ? t('row.sold', { amount: fmtNum(stats.sold) }) : t('row.noSales')) : s.email}
        </p>
        {!s.isActive && <SellerStatusBadge isActive={false} className="mt-1" />}
      </div>

      {stats && (
        <div className="shrink-0 text-right">
          <p
            className={cn(
              'font-mono text-base leading-snug font-semibold',
              balance > 0 ? 'text-success' : balance < 0 ? 'text-warning' : 'text-muted-foreground'
            )}>
            {fmtNum(balance)}
          </p>
          <p className="text-muted-foreground text-xs leading-snug">
            {balance < 0 ? t('row.overpaid') : balance > 0 ? t('row.toPay') : t('row.nothingToPay')}
          </p>
          {stats.earned > 0 && (
            <p className="text-muted-foreground text-xs leading-snug">
              {t('row.earned', { amount: fmtNum(stats.earned) })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
