import type { Product } from '~/types/products';

/**
 * Пороги «запас в днях» для мобильной строки товара. Пока бэк не отдаёт готовый
 * статус для списка, держим их здесь одним местом: меняются в одной строке, и
 * строка, и любой будущий экран получают одинаковый ответ.
 */
export const STOCK_DAYS_CRITICAL = 7;
export const STOCK_DAYS_WARNING = 14;
/** Всё, что дольше года, показываем как «>1 г.» — точное число тут не помогает. */
export const STOCK_DAYS_CAP = 365;

export type ProductStatusKind =
  | 'out' // закончился
  | 'low' // мало — красный чип
  | 'soon' // скоро кончится — жёлтый чип
  | 'returns' // много возвратов — жёлтый чип
  | 'slow' // лежит без движения — тихая серая подпись
  | 'ok'; // норма — зелёная точка

export interface ProductStatus {
  kind: ProductStatusKind;
  /** Запас в днях, уже округлённый; null — продаж нет, считать нечего. */
  days: number | null;
  /** Больше года — рисуется как «>1 г.». */
  overYear: boolean;
}

/**
 * Один статус вместо двух бейджей (health + reorderPriority): список показывает
 * исключения, а не норму. Приоритет — от самого срочного к самому спокойному.
 */
export function getProductStatus(product: Product): ProductStatus {
  const metrics = product.metrics;
  const rawDays = metrics?.daysOfStockRemaining;
  const days = rawDays == null ? null : Math.max(0, Math.round(rawDays));
  const overYear = days != null && days > STOCK_DAYS_CAP;
  const health = metrics?.health;

  const base = { days, overYear };

  if (product.quantity <= 0 || health === 'OUT_OF_STOCK') return { kind: 'out', ...base };

  const belowThreshold = product.quantity <= product.lowStockThreshold;
  if (
    health === 'CRITICAL' ||
    health === 'LOW_STOCK' ||
    belowThreshold ||
    (days != null && days < STOCK_DAYS_CRITICAL)
  ) {
    return { kind: 'low', ...base };
  }

  if (days != null && days < STOCK_DAYS_WARNING) return { kind: 'soon', ...base };
  if (health === 'HIGH_RETURNS') return { kind: 'returns', ...base };
  if (health === 'SLOW_MOVING' || health === 'NO_SALES') return { kind: 'slow', ...base };

  return { kind: 'ok', ...base };
}
