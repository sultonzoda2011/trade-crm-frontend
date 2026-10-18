import { hashKey, type Mutation, type QueryClient } from '@tanstack/react-query';
import { resolveRealId } from '~/lib/client-ids';
import { toPlainError } from '~/lib/offline-errors';
import {
  OFFLINE_QUEUE_SCOPE,
  type QueuedCreateDebtorVars,
  type QueuedCreateTransactionVars,
  type QueuedPayTransactionVars,
  type QueuedRefundTransactionVars,
} from '~/lib/offline-mutations';
import { KIND_BY_KEY_HASH, type QueueKind } from '~/lib/offline-queue';
import { getSentAt, SENT_OVERLAY_MAX_MS } from '~/lib/offline-sent';
import type { UserInfo } from '~/lib/auth-utils';
import type { Debtor } from '~/types/debtors';
import type { ActiveFilter } from '~/types/filters';
import type { DebtorRow, PendingFields, PendingMeta, PendingStatus, TransactionRow } from '~/types/pending';
import type { TransactionItem, TransactionListItem } from '~/types/transactions';

/**
 * Оверлей очереди поверх списков.
 *
 * Список сервера не знает про операции, которые ещё в пути, поэтому они выглядели бы
 * потерянными. Вместо того чтобы патчить кеш react-query (его потом пришлось бы
 * откатывать и сверять с ответом сервера), строки и их последствия — новый должник,
 * новая продажа, оплата, возврат — каждый раз выводятся из очереди (MutationCache) и
 * подмешиваются к данным сервера при рендере. Операция ушла из очереди — оверлея нет,
 * откатывать нечего.
 */

export interface OverlayOp {
  mutationId: number;
  kind: QueueKind;
  status: PendingStatus;
  queuedAt: number;
  attempts: number;
  /** Idempotency-Key операции — стабильный идентификатор, переживает перезапуск. */
  key: string;
  /** Когда сервер принял операцию (только у `sent`). */
  sentAt?: number;
  error?: PendingMeta['error'];
  vars: unknown;
}

type AnyMutation = Mutation<unknown, unknown, unknown, unknown>;

export function toOverlayOp(mutation: AnyMutation): OverlayOp | null {
  const kind = KIND_BY_KEY_HASH.get(hashKey(mutation.options.mutationKey ?? []));
  if (!kind) return null;

  const { status, isPaused, failureCount, error, variables, submittedAt } = mutation.state;
  const key = (variables as { idempotencyKey?: string } | undefined)?.idempotencyKey;
  if (!key) return null;

  let mapped: PendingStatus;
  if (status === 'success') mapped = 'sent';
  else if (status === 'error') mapped = 'failed';
  else if (status === 'pending') mapped = isPaused ? 'waiting' : failureCount > 0 ? 'retrying' : 'sending';
  else return null;

  return {
    mutationId: mutation.mutationId,
    kind,
    status: mapped,
    queuedAt: submittedAt,
    attempts: failureCount,
    key,
    sentAt: mapped === 'sent' ? getSentAt(key) : undefined,
    error: mapped === 'failed' && error ? toPlainError(error) : undefined,
    vars: variables,
  };
}

/**
 * Влияет ли операция на список сейчас. Принятая сервером операция остаётся в оверлее,
 * пока список не перезапросился уже после её принятия (`dataUpdatedAt` свежее `sentAt`):
 * иначе между ответом сервера и обновлением списка запись на миг пропадала бы, а потом
 * появлялась снова. Верхний предел — страховка на случай, если список так и не обновился.
 */
export function isLive(op: OverlayOp, dataUpdatedAt: number, now: number): boolean {
  if (op.status !== 'sent') return true;
  if (op.sentAt === undefined) return false;
  return op.sentAt > dataUpdatedAt && now - op.sentAt < SENT_OVERLAY_MAX_MS;
}

/** Операции, чьи цифры (остатки, долги) ещё не попали на сервер. Упавшие сюда не входят: они ничего не изменили. */
const countsTowardTotals = (op: OverlayOp) => op.status !== 'failed';

const metaOf = (op: OverlayOp): PendingMeta => ({
  mutationId: op.mutationId,
  status: op.status,
  queuedAt: op.queuedAt,
  attempts: op.attempts,
  error: op.error,
});

const norm = (id: string | null | undefined) => (id ? resolveRealId(id) : '');

// ───────────────────────────── фильтры и поиск ─────────────────────────────

const NEUTRAL_FILTERS = new Set(['sortBy', 'sortOrder']);

function todayIso(now: number): string {
  const d = new Date(now);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Совпадает ли только что созданная строка с активными фильтрами. Фильтры, смысл
 * которых мы не знаем, скрывают строку — лучше не показать лишнего, чем показать
 * в чужой выборке (после обновления списка сервер покажет её сам).
 */
function matchesFilters(filters: ActiveFilter[], fields: Record<string, unknown>, now: number): boolean {
  const today = todayIso(now);
  return filters.every(({ key, value }) => {
    if (NEUTRAL_FILTERS.has(key) || value === undefined || value === null || value === '') return true;
    if (key === 'dateFrom') return today >= String(value).slice(0, 10);
    if (key === 'dateTo') return today <= String(value).slice(0, 10);
    if (!(key in fields)) return false;
    const accepted = Array.isArray(value) ? value.map(String) : [String(value)];
    return accepted.includes(String(fields[key]));
  });
}

const includesText = (haystack: Array<string | null | undefined>, needle: string) => {
  const q = needle.trim().toLowerCase();
  return !q || haystack.some((part) => part?.toLowerCase().includes(q));
};

// ───────────────────────────── должники ─────────────────────────────

function buildDebtorRow(op: OverlayOp, user: UserInfo | null): DebtorRow {
  const vars = op.vars as QueuedCreateDebtorVars;
  const at = new Date(op.queuedAt).toISOString();
  return {
    id: vars.clientId,
    name: vars.payload.name,
    phone: vars.payload.phone,
    marketId: user?.marketId ?? '',
    createdAt: at,
    updatedAt: at,
    market: null,
    _count: { transactions: 0 },
    totalDebtAmount: 0,
    activeDebtCount: 0,
    overdueAmount: 0,
    overdueCount: 0,
    totalIssued: 0,
    totalCollected: 0,
    repaymentRate: 0,
    maxDaysOverdue: 0,
    daysSinceLastPayment: null,
    lastPaymentAt: null,
    nextDueDate: null,
    risk: 'LOW',
    score: 0,
    factors: [],
    activeDebtTransactionId: null,
    lastPurchase: null,
    pending: metaOf(op),
  };
}

interface DebtEffect {
  debt: number;
  pay: number;
}

/** Что очередь меняет в долге каждого должника: новые долги (+) и оплаты (−). */
function debtEffects(ops: OverlayOp[]): Map<string, DebtEffect> {
  const effects = new Map<string, DebtEffect>();
  const bump = (debtorId: string | null | undefined, field: keyof DebtEffect, amount: number) => {
    const id = norm(debtorId);
    if (!id || !amount) return;
    const current = effects.get(id) ?? { debt: 0, pay: 0 };
    current[field] += amount;
    effects.set(id, current);
  };

  for (const op of ops) {
    if (!countsTowardTotals(op)) continue;
    if (op.kind === 'create') {
      const vars = op.vars as QueuedCreateTransactionVars;
      if (vars.payload.type === 'DEBT') bump(vars.payload.debtorId, 'debt', vars.preview?.total ?? 0);
    } else if (op.kind === 'pay') {
      const vars = op.vars as QueuedPayTransactionVars;
      bump(vars.preview?.debtorId, 'pay', Number(vars.request.amount) || 0);
    }
  }
  return effects;
}

function withDebtEffect<T extends Debtor & PendingFields>(row: T, effects: Map<string, DebtEffect>): T {
  const effect = effects.get(norm(row.id));
  if (!effect) return row;
  return {
    ...row,
    totalDebtAmount: Math.max(0, row.totalDebtAmount + effect.debt - effect.pay),
    pendingOps: { ...row.pendingOps, debt: effect.debt || undefined, pay: effect.pay || undefined },
  };
}

export interface DebtorMergeOptions {
  page: number;
  search?: string;
  filters?: ActiveFilter[];
  /** Когда список последний раз успешно загрузился (`useQuery().dataUpdatedAt`). */
  dataUpdatedAt: number;
  user: UserInfo | null;
  now?: number;
}

/** Строки сервера + ожидающие должники сверху + пересчитанный долг. */
export function mergeDebtorRows(server: Debtor[], ops: OverlayOp[], opts: DebtorMergeOptions): DebtorRow[] {
  const now = opts.now ?? Date.now();
  const live = ops.filter((op) => isLive(op, opts.dataUpdatedAt, now));
  const effects = debtEffects(live);

  const rows: DebtorRow[] = server.map((d) => withDebtEffect(d as DebtorRow, effects));
  if (opts.page > 1) return rows;

  const pending = live
    .filter((op) => op.kind === 'debtor')
    .map((op) => buildDebtorRow(op, opts.user))
    .filter(
      (row) =>
        includesText([row.name, row.phone], opts.search ?? '') && matchesFilters(opts.filters ?? [], {}, now)
    )
    .map((row) => withDebtEffect(row, effects))
    .sort((a, b) => (b.pending?.queuedAt ?? 0) - (a.pending?.queuedAt ?? 0));

  return [...pending, ...rows];
}

/** Должники из очереди, которых можно выбрать в форме (упавшие — нет: такого должника сервер не создал). */
export function pendingDebtors(ops: OverlayOp[], user: UserInfo | null, dataUpdatedAt: number, now = Date.now()) {
  return ops
    .filter((op) => op.kind === 'debtor' && op.status !== 'failed' && isLive(op, dataUpdatedAt, now))
    .map((op) => buildDebtorRow(op, user))
    .sort((a, b) => (b.pending?.queuedAt ?? 0) - (a.pending?.queuedAt ?? 0));
}

// ───────────────────────────── транзакции ─────────────────────────────

function buildTransactionRow(op: OverlayOp, user: UserInfo | null): TransactionRow {
  const vars = op.vars as QueuedCreateTransactionVars;
  const { payload, preview } = vars;
  const at = new Date(op.queuedAt).toISOString();
  const id = `local-${op.key}`;
  const total = preview?.total ?? 0;
  const isDebt = payload.type === 'DEBT';

  const items: TransactionItem[] = payload.items.map((item, index) => {
    const snapshot = preview?.items.find((p) => p.productId === item.productId);
    const price = snapshot?.price ?? 0;
    return {
      id: `${id}-${index}`,
      transactionId: id,
      productId: item.productId,
      productName: snapshot?.name ?? '',
      quantity: item.quantity,
      price,
      discount: item.discount ?? 0,
      markup: item.markup ?? 0,
      totalPrice: Math.max(price * item.quantity - (item.discount ?? 0) + (item.markup ?? 0), 0),
      refundedQuantity: 0,
      refundOfItemId: null,
      product: { id: item.productId, name: snapshot?.name ?? '', price, image: snapshot?.image ?? null },
    };
  });

  const debtorId = payload.debtorId ? norm(payload.debtorId) : null;
  const row: TransactionRow = {
    id,
    marketId: user?.marketId ?? '',
    createdById: user?.id ?? '',
    debtorId,
    customerName: payload.customerName ?? null,
    refundOfId: null,
    type: payload.type,
    paymentType: payload.paymentType,
    totalAmount: total,
    discountAmount: 0,
    markupAmount: 0,
    remainingAmount: isDebt ? total : 0,
    status: isDebt ? 'ACTIVE' : 'PAID',
    dueDate: payload.dueDate ?? null,
    createdAt: at,
    updatedAt: at,
    items,
    createdBy: { id: user?.id ?? '', name: user?.name ?? '', email: user?.email ?? '', image: user?.image ?? null },
    debtor: debtorId
      ? { id: debtorId, name: preview?.debtorName ?? '', phone: preview?.debtorPhone ?? '' }
      : null,
    market: { id: user?.marketId ?? '', name: '' },
    pending: metaOf(op),
  };
  return row;
}

function withTransactionEffects(
  row: TransactionListItem & PendingFields,
  paid: Map<string, number>,
  refunded: Set<string>
): TransactionRow {
  const pay = paid.get(row.id);
  const refund = refunded.has(row.id);
  if (!pay && !refund) return row;

  let next: TransactionRow = { ...row, pendingOps: { ...row.pendingOps, pay: pay || undefined, refund: refund || undefined } };
  if (pay) {
    const remaining = Math.max(0, row.remainingAmount - pay);
    next = {
      ...next,
      remainingAmount: remaining,
      status: remaining <= 0 ? 'PAID' : row.status === 'ACTIVE' ? 'PARTIAL' : row.status,
    };
  }
  return next;
}

export interface TransactionMergeOptions {
  page: number;
  search?: string;
  filters?: ActiveFilter[];
  dataUpdatedAt: number;
  user: UserInfo | null;
  now?: number;
}

export function mergeTransactionRows(
  server: TransactionListItem[],
  ops: OverlayOp[],
  opts: TransactionMergeOptions
): TransactionRow[] {
  const now = opts.now ?? Date.now();
  const live = ops.filter((op) => isLive(op, opts.dataUpdatedAt, now));

  const paid = new Map<string, number>();
  const refunded = new Set<string>();
  for (const op of live) {
    if (!countsTowardTotals(op)) continue;
    if (op.kind === 'pay') {
      const vars = op.vars as QueuedPayTransactionVars;
      paid.set(vars.id, (paid.get(vars.id) ?? 0) + (Number(vars.request.amount) || 0));
    } else if (op.kind === 'refund') {
      refunded.add((op.vars as QueuedRefundTransactionVars).id);
    }
  }

  const rows = server.map((tx) => withTransactionEffects(tx, paid, refunded));
  if (opts.page > 1) return rows;

  const pending = live
    .filter((op) => op.kind === 'create')
    .map((op) => buildTransactionRow(op, opts.user))
    .filter(
      (row) =>
        includesText(
          [row.debtor?.name, row.customerName, ...row.items.map((i) => i.productName)],
          opts.search ?? ''
        ) &&
        matchesFilters(
          opts.filters ?? [],
          {
            type: row.type,
            paymentType: row.paymentType,
            status: row.status,
            debtorId: row.debtorId ?? '',
            createdById: row.createdById,
          },
          now
        )
    )
    .sort((a, b) => (b.pending?.queuedAt ?? 0) - (a.pending?.queuedAt ?? 0));

  return [...pending, ...rows];
}

// ───────────────────────────── остатки товара ─────────────────────────────

/**
 * Сколько единиц каждого товара уже «продано» операциями из очереди, но ещё не
 * списано на сервере. Без этого продавец без связи мог бы продать один и тот же
 * остаток дважды, а бэкенд отклонил бы вторую продажу уже при синхронизации.
 */
export function pendingStockUsage(ops: OverlayOp[], dataUpdatedAt: number, now = Date.now()): Record<string, number> {
  const used: Record<string, number> = {};
  for (const op of ops) {
    if (op.kind !== 'create' || !countsTowardTotals(op) || !isLive(op, dataUpdatedAt, now)) continue;
    for (const item of (op.vars as QueuedCreateTransactionVars).payload.items) {
      used[item.productId] = (used[item.productId] ?? 0) + (Number(item.quantity) || 0);
    }
  }
  return used;
}


// ───────────────────────────── вне React ─────────────────────────────

/** Снимок очереди для кода вне компонентов (например, перед открытием окна оплаты). */
export function collectOverlayOps(queryClient: QueryClient): OverlayOp[] {
  return queryClient
    .getMutationCache()
    .getAll()
    .filter((mutation) => mutation.options.scope?.id === OFFLINE_QUEUE_SCOPE.id)
    .map((mutation) => toOverlayOp(mutation as AnyMutation))
    .filter((op): op is OverlayOp => op !== null);
}

/**
 * Сколько по этой транзакции уже заплачено операциями, которые ещё в очереди. Принятые сервером
 * (`sent`) не считаем: данные, с которыми сравниваем, загружены позже, они уже учтены.
 */
export function pendingPaidAmount(ops: OverlayOp[], transactionId: string): number {
  let sum = 0;
  for (const op of ops) {
    if (op.kind !== 'pay' || op.status === 'sent' || !countsTowardTotals(op)) continue;
    const vars = op.vars as QueuedPayTransactionVars;
    if (vars.id === transactionId) sum += Number(vars.request.amount) || 0;
  }
  return sum;
}

/** Транзакция с остатком за вычетом оплат из очереди — чтобы окно оплаты не предложило заплатить больше, чем осталось. */
export function withPendingPayments<T extends { id: string; remainingAmount: number }>(tx: T, ops: OverlayOp[]): T {
  const paid = pendingPaidAmount(ops, tx.id);
  return paid > 0 ? { ...tx, remainingAmount: Math.max(0, tx.remainingAmount - paid) } : tx;
}

/** Должник со своим долгом с учётом очереди — для карточки должника. */
export function withDebtorQueueEffects<T extends Debtor>(
  debtor: T,
  ops: OverlayOp[],
  dataUpdatedAt: number,
  now = Date.now()
): T & PendingFields {
  const live = ops.filter((op) => isLive(op, dataUpdatedAt, now));
  return withDebtEffect<T & PendingFields>(debtor, debtEffects(live));
}
