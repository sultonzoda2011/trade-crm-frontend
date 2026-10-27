import type { QueryClient } from '@tanstack/react-query';
import i18next from 'i18next';
import { debtorsApi } from '~/api/debtors';
import { transactionsApi } from '~/api/transactions';
import { createUuid, isClientId, rememberRealId, resolveRealId } from '~/lib/client-ids';
import { getServerMessage, isTransientError } from '~/lib/offline-errors';
import { markSent } from '~/lib/offline-sent';
import { queryKeys } from '~/lib/query-keys';
import { showSuccess } from '~/store/useSuccessStore';
import { toast } from 'sonner';
import type { DebtorRequest } from '~/types/debtors';
import type { CreatePaymentRequest, CreateTransactionRequest, RefundTransactionRequest } from '~/types/transactions';

/**
 * Мутации, которым нужно продолжать работать без сети/на слабом канале вместо
 * того чтобы держать пользователя на экране в ожидании ответа.
 *
 * Механизм — встроенный в TanStack Query, не самодельная очередь:
 *   1. У мутаций по умолчанию networkMode: 'online' — если устройство офлайн
 *      (наш onlineManager в network-status.ts подключён к Capacitor Network),
 *      mutationFn вообще не вызывается, мутация сразу уходит в isPaused.
 *   2. root.tsx персистит именно такие (paused) мутации из списка ниже в ту
 *      же SQLite-базу, что и кеш чтения — так очередь переживает перезапуск
 *      приложения.
 *   3. query-client.ts зовёт queryClient.resumePausedMutations() при каждом
 *      возврате сети, root.tsx — ещё раз сразу после восстановления персиста
 *      (на случай когда к моменту открытия приложения сеть уже есть).
 *
 * Сюда попали только флоу с реальной офлайн-ценностью для продавца на точке —
 * новый должник, продажа/долг, оплата, возврат — и ровно то, что бэкенд умеет
 * дедуплицировать через Idempotency-Key (см. IdempotencyInterceptor в
 * trade-crm-backend).
 *
 * Поставленная в очередь операция сразу видна в списках: оверлей
 * (offline-overlay.ts) подмешивает её к данным сервера, а временные `local-…`
 * id (client-ids.ts) позволяют ссылаться на ещё не созданную запись — например,
 * «дать долг» только что заведённому без связи должнику. Остальной CRUD (markets/products/users/...) в очередь
 * не ставится — сознательно неполное покрытие, а не полноценный офлайн-режим
 * для всего приложения.
 *
 * `mutationKey` здесь — это не ключ чтения из query-keys.ts, а идентификатор
 * ОПРЕДЕЛЕНИЯ мутации: по нему `setMutationDefaults` подставляет mutationFn
 * обратно при восстановлении из персиста, потому что функции не
 * сериализуются — в SQLite попадают только mutationKey/variables/state.
 */
export const OFFLINE_MUTATION_KEYS = {
  createDebtor: ['debtors', 'create'] as const,
  createTransaction: ['transactions', 'create'] as const,
  payTransaction: ['transactions', 'pay'] as const,
  refundTransaction: ['transactions', 'refund'] as const,
};

/**
 * Все операции идут через ОДНУ последовательную очередь: пока предыдущая не
 * закончилась, следующая ждёт. Так на слабой сети не уходит пачка параллельных
 * запросов (и не упирается в лимит 100 запросов/мин на IP), а порядок отправки
 * совпадает с порядком, в котором продавец их оформил.
 */
export const OFFLINE_QUEUE_SCOPE = { id: 'offline-transactions' } as const;

/** Сколько раз пробуем отправить на временном сбое, прежде чем показать «ошибка» с кнопкой «Повторить». */
export const MAX_SEND_ATTEMPTS = 5;

const QUEUE_OPTIONS = {
  scope: OFFLINE_QUEUE_SCOPE,
  // Сеть/таймаут/5xx/429 — пробуем снова с нарастающей паузой (2, 4, 8, 16 с).
  // Бизнес-ошибку (400/403/422: «недостаточно товара» и т.п.) повторять
  // бессмысленно — она сразу превращается в «ошибка» в очереди. Повтор безопасен:
  // у каждой операции свой Idempotency-Key, сервер второй раз её не выполнит.
  retry: (failureCount: number, error: unknown) => isTransientError(error) && failureCount < MAX_SEND_ATTEMPTS - 1,
  retryDelay: (failureCount: number) => Math.min(2000 * 2 ** failureCount, 30_000),
  // Операция не должна исчезнуть из очереди сама: упавшая ждёт решения человека
  // (повторить или убрать), а не 5 минут сборщика мусора. Успешные чистит
  // MutationCache в query-client.ts.
  gcTime: Infinity,
};

export interface QueuedCreateDebtorVars {
  idempotencyKey: string;
  /** Временный id (`local-…`): под ним должник виден в списках, пока сервер его не создал. */
  clientId: string;
  payload: DebtorRequest;
}

/** Снимок того, что показать в списке, пока транзакции нет на сервере: цена/название/фото на момент оформления. */
export interface TransactionPreview {
  total: number;
  debtorName?: string;
  debtorPhone?: string;
  items: Array<{ productId: string; name: string; quantity: number; price: number; image: string | null }>;
}

export interface QueuedCreateTransactionVars {
  idempotencyKey: string;
  /** `payload.debtorId` может быть временным `local-…` — подменяется на настоящий при отправке. */
  payload: CreateTransactionRequest;
  preview?: TransactionPreview;
}

export interface QueuedPayTransactionVars {
  idempotencyKey: string;
  id: string;
  request: CreatePaymentRequest;
  /** Чей это долг — чтобы пересчитать сумму долга должника в списке, пока оплата в очереди. */
  preview?: { debtorId: string | null };
}

export interface QueuedRefundTransactionVars {
  idempotencyKey: string;
  id: string;
  request?: RefundTransactionRequest;
}

/** Ключ идемпотентности: создаётся один раз при постановке операции в очередь и переиспользуется на каждой попытке. */
export const createIdempotencyKey = createUuid;

/** Ошибка зависимости внутри очереди: повторять бессмысленно, ждёт решения человека. */
function dependencyError(message: string): Error {
  return Object.assign(new Error(message), { transient: false });
}

/**
 * Подставляет настоящий id вместо временного. Очередь последовательная, поэтому к
 * моменту отправки продажи должник, заведённый перед ней, уже создан. Если нет —
 * его создание упало или было убрано из очереди: продажу без него отправлять нельзя.
 */
function withRealDebtor(payload: CreateTransactionRequest): CreateTransactionRequest {
  if (!payload.debtorId) return payload;
  const debtorId = resolveRealId(payload.debtorId);
  if (isClientId(debtorId)) {
    throw dependencyError(i18next.t('debtorNotCreated', { ns: 'transactions' }));
  }
  return debtorId === payload.debtorId ? payload : { ...payload, debtorId };
}

function invalidateAfterDebtorWrite(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.entity('debtors') });
}

function invalidateAfterTransactionWrite(queryClient: QueryClient, transactionId?: string) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.entity('transactions') });
  // Продажа списывает остатки, долг/оплата/возврат меняют сумму у должника —
  // без этого списки до конца staleTime показывали бы старые цифры.
  void queryClient.invalidateQueries({ queryKey: queryKeys.entity('products') });
  void queryClient.invalidateQueries({ queryKey: queryKeys.entity('debtors') });
  if (transactionId) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.full('transactions', transactionId) });
  }
}

/**
 * Регистрируется один раз на QueryClient (см. query-client.ts). Это то, что
 * реально отправляет отложенную мутацию, когда resumePausedMutations() её
 * будит — в том числе после перезапуска приложения, когда компонент, который
 * вызвал mutate() (и его собственный onSuccess/onError), уже давно
 * размонтирован. Поэтому инвалидация и уведомление об успехе/ошибке живут
 * здесь, а не только в useMutation() на странице: тот отвечает за то, что
 * видно непосредственно в момент отправки формы (см. вызовы на страницах
 * транзакций), а это — за то, что произойдёт, когда очередь реально дойдёт
 * до сервера, с кем бы пользователь к тому моменту ни разговаривал.
 */
export function registerOfflineMutationDefaults(queryClient: QueryClient) {
  const fail =
    (key: 'createError' | 'payError' | 'refundError', ns: 'transactions' | 'debtors' = 'transactions') =>
    (error: unknown) => {
      // Единственный тост об ошибке: сам запрос идёт с `silent` (см. transactions.ts),
      // поэтому перехватчик axios не дублирует его на каждой попытке.
      toast.error(i18next.t(key, { ns }), { description: getServerMessage(error) ?? (error as Error)?.message });
    };

  queryClient.setMutationDefaults(OFFLINE_MUTATION_KEYS.createDebtor, {
    ...QUEUE_OPTIONS,
    mutationFn: (vars: QueuedCreateDebtorVars) => debtorsApi.create(vars.payload, vars.idempotencyKey),
    onSuccess: (response, vars) => {
      // Связываем временный id с настоящим ДО обновления списков: следующая в очереди
      // продажа этому должнику подставит его именно отсюда.
      const realId = response?.data?.id;
      if (realId) rememberRealId(vars.clientId, realId);
      markSent(vars.idempotencyKey);
      invalidateAfterDebtorWrite(queryClient);
      toast.success(i18next.t('createSuccess', { ns: 'debtors' }));
      // Дубль номера не блокирует создание (на рынке один телефон бывает у двоих) — только предупреждаем.
      const duplicate = response?.data?.phoneDuplicateOf;
      if (duplicate) toast.warning(i18next.t('phoneDuplicate', { ns: 'debtors', name: duplicate.name }));
    },
    onError: fail('createError', 'debtors'),
  });

  queryClient.setMutationDefaults(OFFLINE_MUTATION_KEYS.createTransaction, {
    ...QUEUE_OPTIONS,
    mutationFn: (vars: QueuedCreateTransactionVars) =>
      transactionsApi.create(withRealDebtor(vars.payload), vars.idempotencyKey),
    onSuccess: (response, vars) => {
      markSent(vars.idempotencyKey);
      invalidateAfterTransactionWrite(queryClient);
      // `?.`: при гонке дубликатов бэкенд может вернуть пустой сохранённый ответ.
      showSuccess({ title: i18next.t('createSuccess', { ns: 'transactions' }), amount: response?.data?.totalAmount });
    },
    onError: fail('createError'),
  });

  queryClient.setMutationDefaults(OFFLINE_MUTATION_KEYS.payTransaction, {
    ...QUEUE_OPTIONS,
    mutationFn: (vars: QueuedPayTransactionVars) =>
      transactionsApi.pay({ request: vars.request, id: vars.id }, vars.idempotencyKey),
    onSuccess: (_response, vars) => {
      markSent(vars.idempotencyKey);
      invalidateAfterTransactionWrite(queryClient, vars.id);
      showSuccess({ title: i18next.t('paySuccess', { ns: 'transactions' }), amount: vars.request.amount });
    },
    onError: fail('payError'),
  });

  queryClient.setMutationDefaults(OFFLINE_MUTATION_KEYS.refundTransaction, {
    ...QUEUE_OPTIONS,
    mutationFn: (vars: QueuedRefundTransactionVars) =>
      transactionsApi.refund({ id: vars.id, request: vars.request }, vars.idempotencyKey),
    onSuccess: (response, vars) => {
      markSent(vars.idempotencyKey);
      invalidateAfterTransactionWrite(queryClient, vars.id);
      showSuccess({
        title: i18next.t('refundSuccess', { ns: 'transactions' }),
        amount: response?.data?.summary?.refundedAmount,
      });
    },
    onError: fail('refundError'),
  });
}
