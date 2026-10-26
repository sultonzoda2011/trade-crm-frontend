import type { FilterConflict } from '~/lib/filter-rules';

/** Состояния долга, при которых остаток к оплате больше нуля. */
const OPEN_DEBT = ['OUTSTANDING', 'OVERDUE', 'DUE_SOON'] as const;
/** Любое состояние долга: фильтр `debtStatus` на бэкенде всегда сужает выборку до `type = DEBT`. */
const ANY_DEBT_STATE = [...OPEN_DEBT, 'SETTLED'] as const;
/** Способы, которыми платят сразу и сполна. */
const PAID_ON_SPOT = ['CASH', 'CARD'] as const;
/** Статусы, у которых остаток ещё не закрыт. */
const UNSETTLED_STATUS = ['ACTIVE', 'PARTIAL'] as const;
/** Статусы закрытой или возвращённой транзакции — остатка у неё нет. */
const CLOSED_STATUS = ['PAID', 'REFUNDED', 'PARTIALLY_REFUNDED'] as const;

/**
 * Сочетания, которых в транзакциях не бывает. Основание — форма создания, оверлей очереди и
 * `TransactionsService` на бэкенде: долг (`DEBT`) всегда оформляется способом «Кредит», а продажа
 * за наличные или карту оплачивается сразу — остатка у неё нет (`remainingAmount: 0`, статус `PAID`).
 * Фильтр `debtStatus` бэкенд применяет вместе с `type = DEBT`, поэтому «Продажа» и «Возврат» с любым
 * состоянием долга, как и способ «Наличные» / «Карта», дают пустой список. Состояние долга и статус
 * согласованы так же, как в `applyDebtStatusFilter`: открытый долг — `ACTIVE` / `PARTIAL`, закрытый — `PAID`.
 * Фильтр по таким парам вернул бы пустой список, поэтому второй пункт отключается.
 */
export const TRANSACTION_FILTER_RULES: readonly FilterConflict[] = [
  [
    { key: 'type', values: ['DEBT'] },
    { key: 'paymentType', values: PAID_ON_SPOT },
  ],
  [
    { key: 'type', values: ['SALE'] },
    { key: 'paymentType', values: ['CREDIT'] },
  ],
  [
    { key: 'type', values: ['SALE', 'REFUND'] },
    { key: 'debtStatus', values: ANY_DEBT_STATE },
  ],
  [
    { key: 'paymentType', values: PAID_ON_SPOT },
    { key: 'debtStatus', values: ANY_DEBT_STATE },
  ],
  [
    { key: 'status', values: CLOSED_STATUS },
    { key: 'debtStatus', values: OPEN_DEBT },
  ],
  [
    { key: 'status', values: UNSETTLED_STATUS },
    { key: 'debtStatus', values: ['SETTLED'] },
  ],
  [
    { key: 'type', values: ['SALE'] },
    { key: 'status', values: UNSETTLED_STATUS },
  ],
  [
    { key: 'paymentType', values: PAID_ON_SPOT },
    { key: 'status', values: UNSETTLED_STATUS },
  ],
];

type Health = 'OUT_OF_STOCK' | 'CRITICAL' | 'LOW_STOCK' | 'HIGH_RETURNS' | 'NO_SALES' | 'SLOW_MOVING' | 'HEALTHY';
type ReorderPriority = 'OUT_OF_STOCK' | 'CRITICAL' | 'WARNING' | 'OK' | 'NOT_NEEDED';

const REORDER_PRIORITIES: readonly ReorderPriority[] = ['OUT_OF_STOCK', 'CRITICAL', 'WARNING', 'OK', 'NOT_NEEDED'];

/**
 * Какая срочность закупки вообще возможна при каждом состоянии товара. Выведено из
 * `resolveHealth` и `resolveReorderPriority` бэкенда (`analytics.service.ts`):
 * - нет остатка → срочность «Нет в наличии», а если товар не продаётся — «Заказ не нужен»;
 * - «Критично» по состоянию ⇔ запаса на ≤ 3 дней, то есть срочность «Критично»;
 * - «Мало на складе» всегда ниже ручного порога, поэтому срочность только «Скоро»;
 * - «Нет продаж» не бывает ниже порога, поэтому срочность только «Заказ не нужен»;
 * - «Залежался» (запас ≥ 90 дней) — срочность только «В норме».
 */
const PRIORITIES_BY_HEALTH: Record<Health, readonly ReorderPriority[]> = {
  OUT_OF_STOCK: ['OUT_OF_STOCK', 'NOT_NEEDED'],
  CRITICAL: ['CRITICAL'],
  LOW_STOCK: ['WARNING'],
  HIGH_RETURNS: ['WARNING', 'OK', 'NOT_NEEDED'],
  NO_SALES: ['NOT_NEEDED'],
  SLOW_MOVING: ['OK'],
  HEALTHY: ['WARNING', 'OK', 'NOT_NEEDED'],
};

const HEALTH_PRIORITY_CONFLICTS: FilterConflict[] = (Object.keys(PRIORITIES_BY_HEALTH) as Health[]).flatMap(
  (health) => {
    const impossible = REORDER_PRIORITIES.filter((priority) => !PRIORITIES_BY_HEALTH[health].includes(priority));
    return impossible.length > 0
      ? [
          [
            { key: 'health', values: [health] },
            { key: 'reorderPriority', values: impossible },
          ] satisfies FilterConflict,
        ]
      : [];
  }
);

/**
 * Состояние и срочность закупки товара считает бэкенд, и не все их пары возможны —
 * см. `PRIORITIES_BY_HEALTH`. «Нужно заказать» (`needsReorder`) — это рекомендованное
 * количество больше нуля: оно бывает только при срочности «Нет в наличии», «Критично»
 * и «Скоро», поэтому «В норме», «Заказ не нужен» и состояния «Нет продаж» / «Залежался»
 * (у них срочность именно такая) с ним не сочетаются. Ссылка с дашборда
 * (`/products?needsReorder=true`) выбирает первое, а чипсы не должны предлагать остальное.
 */
export const PRODUCT_FILTER_RULES: readonly FilterConflict[] = [
  ...HEALTH_PRIORITY_CONFLICTS,
  [
    { key: 'needsReorder', values: ['true'] },
    { key: 'reorderPriority', values: ['OK', 'NOT_NEEDED'] },
  ],
  [
    { key: 'needsReorder', values: ['true'] },
    { key: 'health', values: ['NO_SALES', 'SLOW_MOVING'] },
  ],
];

/**
 * Просроченный долг — это активный долг: «просрочен» и «нет активных долгов» не бывают вместе.
 * Без активного долга бэкенд всегда ставит риск «Низкий» (`scoreDebtorRisk`), поэтому
 * «Средний» и «Высокий» с «Нет активных долгов» тоже не сочетаются.
 */
export const DEBTOR_FILTER_RULES: readonly FilterConflict[] = [
  [
    { key: 'overdue', values: ['true'] },
    { key: 'hasActiveDebts', values: ['false'] },
  ],
  [
    { key: 'hasActiveDebts', values: ['false'] },
    { key: 'risk', values: ['MEDIUM', 'HIGH'] },
  ],
  // Без просрочки набирается максимум 6 баллов (размер долга + возврат + давность платежа),
  // а «Высокий» начинается с 7 — такой риск всегда сопровождается просрочкой.
  [
    { key: 'overdue', values: ['false'] },
    { key: 'risk', values: ['HIGH'] },
  ],
];
