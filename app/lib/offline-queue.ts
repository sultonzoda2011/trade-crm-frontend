import { hashKey, type Mutation, type QueryClient } from '@tanstack/react-query';
import { toPlainError, type PlainError } from '~/lib/offline-errors';
import {
  OFFLINE_MUTATION_KEYS,
  OFFLINE_QUEUE_SCOPE,
  type QueuedCreateDebtorVars,
  type QueuedCreateTransactionVars,
  type QueuedPayTransactionVars,
  type QueuedRefundTransactionVars,
} from '~/lib/offline-mutations';

/**
 * Витрина очереди офлайн-операций для UI.
 *
 * Сама очередь — это MutationCache TanStack Query (см. offline-mutations.ts):
 * здесь только превращение мутации в плоскую запись для списка и действия над
 * ней — «повторить», «убрать», «отправить сейчас».
 */

export type QueueKind = 'debtor' | 'create' | 'pay' | 'refund';

/**
 * - waiting  — ждёт: нет сети или впереди ещё не отправленная операция;
 * - sending  — запрос прямо сейчас в пути;
 * - retrying — прошлая попытка не удалась (слабая сеть), следующая скоро;
 * - failed   — отправка остановлена: сервер отклонил или попытки закончились.
 */
export type QueueStatus = 'waiting' | 'sending' | 'retrying' | 'failed';

export interface QueueItem {
  id: number;
  kind: QueueKind;
  status: QueueStatus;
  queuedAt: number;
  attempts: number;
  /** Сумма оплаты — есть только у операции «оплата». */
  amount?: number;
  /** Сколько позиций в продаже / возврате; у «вернуть всё» поля нет. */
  itemsCount?: number;
  /** Продажа или долг — только у «создания». */
  transactionType?: string;
  /** Имя — у «нового должника» и (если известно) у продажи/долга. */
  debtorName?: string;
  /** Для «оплаты»/«возврата» — к какой транзакции относится. */
  transactionId?: string;
  error?: PlainError;
}

export const KIND_BY_KEY_HASH = new Map<string, QueueKind>([
  [hashKey(OFFLINE_MUTATION_KEYS.createDebtor), 'debtor'],
  [hashKey(OFFLINE_MUTATION_KEYS.createTransaction), 'create'],
  [hashKey(OFFLINE_MUTATION_KEYS.payTransaction), 'pay'],
  [hashKey(OFFLINE_MUTATION_KEYS.refundTransaction), 'refund'],
]);

type AnyMutation = Mutation<unknown, unknown, unknown, unknown>;

export function isQueueMutation(mutation: AnyMutation): boolean {
  return mutation.options.scope?.id === OFFLINE_QUEUE_SCOPE.id;
}

export function toQueueItem(mutation: AnyMutation): QueueItem | null {
  const kind = KIND_BY_KEY_HASH.get(hashKey(mutation.options.mutationKey ?? []));
  if (!kind) return null;

  const { status, isPaused, failureCount, error, variables, submittedAt } = mutation.state;
  if (status !== 'pending' && status !== 'error') return null;

  const item: QueueItem = {
    id: mutation.mutationId,
    kind,
    status: status === 'error' ? 'failed' : isPaused ? 'waiting' : failureCount > 0 ? 'retrying' : 'sending',
    queuedAt: submittedAt,
    attempts: failureCount,
    error: status === 'error' && error ? toPlainError(error) : undefined,
  };

  if (kind === 'debtor') {
    const vars = variables as QueuedCreateDebtorVars | undefined;
    item.debtorName = vars?.payload?.name;
  } else if (kind === 'create') {
    const vars = variables as QueuedCreateTransactionVars | undefined;
    item.itemsCount = vars?.payload?.items?.length;
    item.transactionType = vars?.payload?.type;
    item.debtorName = vars?.preview?.debtorName;
  } else if (kind === 'pay') {
    const vars = variables as QueuedPayTransactionVars | undefined;
    item.amount = vars?.request?.amount;
    item.transactionId = vars?.id;
  } else {
    const vars = variables as QueuedRefundTransactionVars | undefined;
    item.itemsCount = vars?.request?.items?.length;
    item.transactionId = vars?.id;
  }
  return item;
}

export function getQueueItems(queryClient: QueryClient): QueueItem[] {
  return queryClient
    .getMutationCache()
    .getAll()
    .map((mutation) => toQueueItem(mutation as AnyMutation))
    .filter((item): item is QueueItem => item !== null)
    .sort((a, b) => a.queuedAt - b.queuedAt);
}

function findMutation(queryClient: QueryClient, id: number) {
  return queryClient
    .getMutationCache()
    .getAll()
    .find((mutation) => mutation.mutationId === id) as AnyMutation | undefined;
}

/** Повторить упавшую операцию: тот же Idempotency-Key, поэтому сервер второй раз её не выполнит. */
export function retryQueueItem(queryClient: QueryClient, id: number): void {
  const mutation = findMutation(queryClient, id);
  if (!mutation || mutation.state.status !== 'error') return;
  void mutation.execute(mutation.state.variables).catch(() => undefined);
}

export function retryAllFailed(queryClient: QueryClient): void {
  for (const item of getQueueItems(queryClient)) {
    if (item.status === 'failed') retryQueueItem(queryClient, item.id);
  }
}

/**
 * Убрать операцию из очереди — она НЕ будет отправлена. Только для ожидающих
 * (запрос ещё не уходил) и упавших; то, что прямо сейчас в пути, трогать нельзя:
 * сервер может успеть её выполнить.
 */
export function removeQueueItem(queryClient: QueryClient, id: number): void {
  const mutation = findMutation(queryClient, id);
  if (!mutation) return;
  const item = toQueueItem(mutation);
  if (!item || !canRemove(item)) return;
  queryClient.getMutationCache().remove(mutation);
}

export const canRemove = (item: QueueItem): boolean =>
  item.status === 'failed' || (item.status === 'waiting' && item.attempts === 0);

export const canRetry = (item: QueueItem): boolean => item.status === 'failed';

/** Отправить сейчас то, что ждёт: полезно, когда сеть уже есть, а очередь ещё не тронулась. */
export function sendQueueNow(queryClient: QueryClient): void {
  void queryClient.resumePausedMutations();
}
