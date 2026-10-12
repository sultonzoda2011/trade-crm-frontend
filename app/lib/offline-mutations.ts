import type { QueryClient } from '@tanstack/react-query';
import i18next from 'i18next';
import { transactionsApi } from '~/api/transactions';
import { getServerMessage, isTransientError } from '~/lib/offline-errors';
import { queryKeys } from '~/lib/query-keys';
import { showSuccess } from '~/store/useSuccessStore';
import { toast } from 'sonner';
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
 * Сюда попали только три флоу с реальной офлайн-ценностью для продавца на
 * точке — продажа/долг, оплата, возврат — и ровно то, что бэкенд умеет
 * дедуплицировать через Idempotency-Key (см. IdempotencyInterceptor в
 * trade-crm-backend). Остальной CRUD (markets/products/users/...) в очередь
 * не ставится — сознательно неполное покрытие, а не полноценный офлайн-режим
 * для всего приложения.
 *
 * `mutationKey` здесь — это не ключ чтения из query-keys.ts, а идентификатор
 * ОПРЕДЕЛЕНИЯ мутации: по нему `setMutationDefaults` подставляет mutationFn
 * обратно при восстановлении из персиста, потому что функции не
 * сериализуются — в SQLite попадают только mutationKey/variables/state.
 */
export const OFFLINE_MUTATION_KEYS = {
  createTransaction: ['transactions', 'create'] as const,
  payTransaction: ['transactions', 'pay'] as const,
  refundTransaction: ['transactions', 'refund'] as const,
};

/**
 * Все три операции идут через ОДНУ последовательную очередь: пока предыдущая не
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

export interface QueuedCreateTransactionVars {
  idempotencyKey: string;
  payload: CreateTransactionRequest;
}

export interface QueuedPayTransactionVars {
  idempotencyKey: string;
  id: string;
  request: CreatePaymentRequest;
}

export interface QueuedRefundTransactionVars {
  idempotencyKey: string;
  id: string;
  request?: RefundTransactionRequest;
}

/**
 * `crypto.randomUUID()` требует secure context (https/localhost) — в самом
 * APK это не проблема (androidScheme: 'https' в capacitor.config.ts), но при
 * тестировании через `npx cap run android --livereload --external` WebView
 * грузит страницу с LAN IP дев-сервера по http, secure context нет, и
 * randomUUID оказывается undefined. Раньше это ломало весь onSubmit
 * синхронным исключением ещё до вызова mutate() — форма создания транзакции
 * переставала что-либо делать по кнопке. crypto.getRandomValues (в отличие
 * от randomUUID) secure context не требует и доступен везде, где доступен
 * сам crypto, поэтому это основной fallback; Math.random — на случай
 * совсем старого WebView без crypto вообще.
 */
export function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
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
  const fail = (key: 'createError' | 'payError' | 'refundError') => (error: unknown) => {
    // Единственный тост об ошибке: сам запрос идёт с `silent` (см. transactions.ts),
    // поэтому перехватчик axios не дублирует его на каждой попытке.
    toast.error(i18next.t(key, { ns: 'transactions' }), { description: getServerMessage(error) });
  };

  queryClient.setMutationDefaults(OFFLINE_MUTATION_KEYS.createTransaction, {
    ...QUEUE_OPTIONS,
    mutationFn: (vars: QueuedCreateTransactionVars) => transactionsApi.create(vars.payload, vars.idempotencyKey),
    onSuccess: (response) => {
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
      invalidateAfterTransactionWrite(queryClient, vars.id);
      showSuccess({
        title: i18next.t('refundSuccess', { ns: 'transactions' }),
        amount: response?.data?.summary?.refundedAmount,
      });
    },
    onError: fail('refundError'),
  });
}
