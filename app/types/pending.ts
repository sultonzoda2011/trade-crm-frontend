import type { PlainError } from '~/lib/offline-errors';
import type { Debtor } from '~/types/debtors';
import type { TransactionListItem } from '~/types/transactions';

/**
 * Состояние операции, которая ещё не подтверждена сервером, но уже видна в списке.
 *  - waiting  — ждёт: нет сети или впереди ещё не отправленная операция;
 *  - sending  — запрос в пути;
 *  - retrying — прошлая попытка не удалась (слабая сеть), скоро следующая;
 *  - failed   — остановилась с ошибкой, ждёт решения человека;
 *  - sent     — сервер принял, список ещё не успел обновиться.
 */
export type PendingStatus = 'waiting' | 'sending' | 'retrying' | 'failed' | 'sent';

/** Строка списка, созданная очередью. У настоящих строк сервера этого поля нет. */
export interface PendingMeta {
  mutationId: number;
  status: PendingStatus;
  queuedAt: number;
  /** Сколько попыток отправки уже было — по ней решается, можно ли ещё убрать операцию из очереди. */
  attempts: number;
  error?: PlainError;
}

/** Что ещё стоит в очереди и затрагивает уже существующую строку (оплата, возврат). */
export interface PendingEffects {
  /** Сумма оплат в очереди — уже вычтена из остатка в этой строке. */
  pay?: number;
  /** Новый долг в очереди — уже прибавлен к сумме долга должника в этой строке. */
  debt?: number;
  /** Возврат в очереди — цифры в строке ещё не отражают его. */
  refund?: boolean;
}

export interface PendingFields {
  pending?: PendingMeta;
  pendingOps?: PendingEffects;
}

export type DebtorRow = Debtor & PendingFields;
export type TransactionRow = TransactionListItem & PendingFields;
