import type { TFunction } from 'i18next';
import type { Row } from '@tanstack/react-table';
import { toDayjs } from '~/lib/date';
import { fmtNum } from '~/lib/format';
import type { TransactionRow } from '~/types/pending';

/**
 * Как показать состояние транзакции в списке — одним цветным «капсюлем».
 *
 * Главное правило: у возврата нет «оплаты». Его статус на сервере — PAID, но это
 * лишь признак «операция проведена», и зелёное «Оплачена» рядом с возвратом читалось
 * как «покупатель заплатил». Поэтому возврат всегда показывает свой тип.
 */
export type BadgeTone = 'success' | 'warning' | 'destructive' | 'primary' | 'muted';

export interface TransactionBadgeInfo {
  label: string;
  tone: BadgeTone;
}

/** Долг просрочен: остаток есть, срок уже прошёл (по календарному дню устройства). */
export function isOverdue(tx: Pick<TransactionRow, 'remainingAmount' | 'dueDate'>): boolean {
  if (!(tx.remainingAmount > 0) || !tx.dueDate) return false;
  const due = toDayjs(tx.dueDate);
  return !!due && due.endOf('day').isBefore(new Date());
}

export function getTransactionBadge(tx: TransactionRow, t: TFunction): TransactionBadgeInfo {
  if (tx.type === 'REFUND') return { label: t('type.REFUND'), tone: 'destructive' };
  if (tx.status === 'REFUNDED') return { label: t('status.REFUNDED'), tone: 'destructive' };
  if (tx.status === 'PARTIALLY_REFUNDED') return { label: t('status.PARTIALLY_REFUNDED'), tone: 'warning' };
  // Остаток долга важнее слова «Активна» — по нему решают, звонить ли должнику.
  if (tx.remainingAmount > 0) {
    if (isOverdue(tx)) {
      return { label: `${t('debtStatus.OVERDUE')} ${fmtNum(tx.remainingAmount)}`, tone: 'destructive' };
    }
    return {
      label: `${t('remaining')} ${fmtNum(tx.remainingAmount)}`,
      tone: tx.status === 'PARTIAL' ? 'primary' : 'warning',
    };
  }
  return { label: t('status.PAID'), tone: 'success' };
}

/**
 * Сумма со знаком. Продажа — приход (+), возврат — расход (−). Долг — это товар,
 * отданный без денег: знак «+» обещал бы деньги, которых в кассе нет, поэтому у долга знака нет.
 */
export function signedAmount(tx: Pick<TransactionRow, 'type' | 'totalAmount'>): {
  text: string;
  tone: 'income' | 'expense' | 'neutral';
} {
  const n = fmtNum(tx.totalAmount);
  if (tx.type === 'SALE') return { text: `+${n}`, tone: 'income' };
  if (tx.type === 'REFUND') return { text: `−${n}`, tone: 'expense' };
  return { text: n, tone: 'neutral' };
}

/** Вклад операции в итог дня: продано (продажи и долги) минус возвраты. */
export function netContribution(tx: Pick<TransactionRow, 'type' | 'totalAmount'>): number {
  return tx.type === 'REFUND' ? -tx.totalAmount : tx.totalAmount;
}

export interface DayGroup {
  /** Календарный день устройства, `YYYY-MM-DD`. */
  key: string;
  rows: Row<TransactionRow>[];
  /** Итог дня; `null`, если часть дня осталась на соседней странице — полная сумма была бы неверной. */
  net: number | null;
}

/**
 * Делит уже отсортированные по дате строки на дни. Группируем подряд идущие строки,
 * поэтому при сортировке по сумме (дни перемешаны) вызывающий код просто не группирует.
 *
 * День у края страницы может продолжаться на соседней: у первой группы — если мы не на
 * первой странице, у последней — если страница не последняя. Итог для такого дня не
 * показываем, чтобы не выдать неполную сумму за итог дня.
 */
export function groupRowsByDay(rows: Row<TransactionRow>[], page: number, totalPages: number): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const row of rows) {
    const key = toDayjs(row.original.createdAt)?.format('YYYY-MM-DD') ?? 'unknown';
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.rows.push(row);
    else groups.push({ key, rows: [row], net: 0 });
  }
  groups.forEach((g, i) => {
    const continuesBefore = i === 0 && page > 1;
    const continuesAfter = i === groups.length - 1 && page < totalPages;
    g.net =
      continuesBefore || continuesAfter || g.key === 'unknown'
        ? null
        : g.rows.reduce((sum, r) => sum + netContribution(r.original), 0);
  });
  return groups;
}
