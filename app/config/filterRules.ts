import type { FilterConflict } from '~/lib/filter-rules';

/** Состояния долга, при которых остаток к оплате больше нуля. */
const OPEN_DEBT = ['OUTSTANDING', 'OVERDUE', 'DUE_SOON'] as const;
/** Способы, которыми платят сразу и сполна. */
const PAID_ON_SPOT = ['CASH', 'CARD'] as const;

/**
 * Сочетания, которых в транзакциях не бывает. Основание — форма создания и оверлей очереди:
 * долг (`DEBT`) всегда оформляется способом «Кредит», а продажа за наличные или карту
 * оплачивается сразу — остатка у неё нет (`remainingAmount: 0`, статус `PAID`).
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
    { key: 'type', values: ['SALE'] },
    { key: 'debtStatus', values: OPEN_DEBT },
  ],
  [
    { key: 'paymentType', values: PAID_ON_SPOT },
    { key: 'debtStatus', values: OPEN_DEBT },
  ],
];

/** Просроченный долг — это активный долг: «просрочен» и «нет активных долгов» не бывают вместе. */
export const DEBTOR_FILTER_RULES: readonly FilterConflict[] = [
  [
    { key: 'overdue', values: ['true'] },
    { key: 'hasActiveDebts', values: ['false'] },
  ],
];
