import type { TFunction } from 'i18next';
import { z } from 'zod';

/** Available stock per product id, used for cross-field stock validation. */
export type StockMap = Record<string, number>;

/** Price per product id, used to validate that discount doesn't exceed the item's total. */
export type PriceMap = Record<string, number>;

/** Single source of truth for the "quantity exceeds available stock" rule. */
export function isOverStock(quantity: unknown, available?: number | null): boolean {
  if (available == null) return false;
  const q = Number(quantity);
  return Number.isFinite(q) && q > available;
}

/**
 * Base-ui `Combobox` (via `FormCustomSelect`/`CustomSelect`) emits `null` when a
 * single-select field is empty or cleared, so every select value is typed as
 * `string | null`. These unions accept `null` as "empty" and produce translated
 * messages instead of raw Zod English errors.
 */
export const createTransactionItemSchema = (t: TFunction, stockMap?: StockMap, priceMap?: PriceMap) =>
  z
    .object({
      productId: z
        .union([z.string(), z.null()])
        .optional()
        .refine((v) => v != null && v !== '', {
          message: t('itemProductRequired', { ns: 'validation' }),
        }),
      quantity: z
        .union([z.string(), z.number(), z.null()])
        .refine((v) => v !== '' && v != null, { message: t('required', { ns: 'validation' }) })
        .refine(
          (v) => {
            const n = Number(v);
            return Number.isFinite(n) && n >= 1 && Number.isInteger(n) && n <= 1_000_000;
          },
          { message: t('quantityMin', { ns: 'validation' }) }
        ),
      discount: z
        .union([z.string(), z.number(), z.null()])
        .optional()
        .refine((v) => v == null || v === '' || (Number(v) >= 0 && Number.isFinite(Number(v))), {
          message: t('discountMin', { ns: 'validation' }),
        }),
      markup: z
        .union([z.string(), z.number(), z.null()])
        .optional()
        .refine((v) => v == null || v === '' || (Number(v) >= 0 && Number.isFinite(Number(v))), {
          message: t('markupMin', { ns: 'validation' }),
        }),
    })
    .superRefine((item, ctx) => {
      if (!item.productId || !stockMap) return;
      const available = stockMap[item.productId];
      if (available == null) {
        ctx.addIssue({
          code: 'custom',
          message: t('stockUnavailable', { ns: 'validation' }),
          path: ['quantity'],
        });
        return;
      }
      if (isOverStock(item.quantity, available)) {
        ctx.addIssue({
          code: 'custom',
          message: t('stockExceeded', { count: available, ns: 'validation' }),
          path: ['quantity'],
        });
      }
    })
    .superRefine((item, ctx) => {
      // Скидка больше "цена × количество + наценка" раньше молча обнуляла
      // итог по позиции (Math.max(..., 0) в подсчёте суммы) — пользователь
      // видел "0 TJS" без объяснений. Явно запрещаем такую скидку.
      if (!item.productId || !priceMap) return;
      const price = priceMap[item.productId];
      if (price == null) return;
      const q = Number(item.quantity) || 0;
      const d = Number(item.discount) || 0;
      const m = Number(item.markup) || 0;
      const gross = q * price + m;
      if (d > gross) {
        ctx.addIssue({
          code: 'custom',
          message: t('discountExceedsTotal', { max: gross, ns: 'validation' }),
          path: ['discount'],
        });
      }
    });

export type CreateTransactionItemSchema = z.infer<ReturnType<typeof createTransactionItemSchema>>;
export type CreateTransactionItemInput = z.input<ReturnType<typeof createTransactionItemSchema>>;

export const createTransactionSchema = (t: TFunction, stockMap?: StockMap, priceMap?: PriceMap) =>
  z
    .object({
      debtorId: z.union([z.string(), z.null()]).optional(),
      type: z
        .union([z.enum(['DEBT', 'SALE']), z.null()])
        .refine((v) => v != null, { message: t('required', { ns: 'validation' }) }),
      customerName: z.string().optional(),
      paymentType: z
        .union([z.enum(['CASH', 'CARD', 'CREDIT']), z.null()])
        .refine((v) => v != null, { message: t('required', { ns: 'validation' }) }),
      dueDate: z
        .union([z.string(), z.null()])
        .optional()
        .refine((val) => val == null || val === '' || /^\d{4}-\d{2}-\d{2}$/.test(val), {
          message: t('invalidDate', { ns: 'validation' }),
        }),
      items: z
        .array(createTransactionItemSchema(t, stockMap, priceMap))
        .min(1, t('itemsRequired', { ns: 'validation' })),
    })
    .superRefine((data, ctx) => {
      if (data.type === 'DEBT') {
        if (!data.dueDate) {
          ctx.addIssue({
            code: 'custom',
            message: t('dueDateRequired', { ns: 'validation' }),
            path: ['dueDate'],
          });
        }
        if (!data.debtorId) {
          ctx.addIssue({
            code: 'custom',
            message: t('debtorRequired', { ns: 'validation' }),
            path: ['debtorId'],
          });
        }
        if (data.paymentType !== 'CREDIT') {
          ctx.addIssue({
            code: 'custom',
            message: t('paymentTypeMismatch', { ns: 'validation' }),
            path: ['paymentType'],
          });
        }
      } else if (data.paymentType === 'CREDIT') {
        ctx.addIssue({
          code: 'custom',
          message: t('paymentTypeMismatch', { ns: 'validation' }),
          path: ['paymentType'],
        });
      }
    });

export type CreateTransactionSchema = z.infer<ReturnType<typeof createTransactionSchema>>;
export type CreateTransactionInput = z.input<ReturnType<typeof createTransactionSchema>>;

export const updateTransactionSchema = (t: TFunction) =>
  z.object({
    debtorId: z.string().optional(),
    customerName: z.string().optional(),
    type: z.enum(['DEBT', 'SALE']),
    paymentType: z.enum(['CASH', 'CARD', 'CREDIT']),
    dueDate: z.string().optional(),
  });

export type UpdateTransactionSchema = z.infer<ReturnType<typeof updateTransactionSchema>>;

export const createPaymentSchema = (t: TFunction) =>
  z.object({
    amount: z.number().min(1, t('required', { ns: 'validation' })),
    note: z.string(),
  });

export type CreatePaymentSchema = z.infer<ReturnType<typeof createPaymentSchema>>;

/** How much of each sale line may still be returned, keyed by line id. */
export type RefundableMap = Record<string, number>;

/**
 * Partial refund form.
 *
 * `mode: 'ALL'` returns everything still refundable and needs no per-line
 * input — the backend does the same thing when `items` is omitted. In
 * `'PARTIAL'` mode each line is capped at its own `refundableQuantity`, which
 * is the exact ceiling the backend enforces; validating it here only saves the
 * user a round trip, it is not the rule itself.
 */
export const refundTransactionSchema = (t: TFunction, refundable: RefundableMap) =>
  z
    .object({
      mode: z.enum(['ALL', 'PARTIAL']),
      reason: z
        .string()
        .max(500, t('stringMax', { count: 500, ns: 'validation' }))
        .optional(),
      items: z.array(
        z.object({
          itemId: z.string(),
          quantity: z.union([z.string(), z.number(), z.null()]).optional(),
        })
      ),
    })
    .superRefine((data, ctx) => {
      if (data.mode === 'ALL') return;

      let selected = 0;
      data.items.forEach((item, index) => {
        if (item.quantity === '' || item.quantity == null) return;
        const quantity = Number(item.quantity);
        const max = refundable[item.itemId] ?? 0;

        if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity <= 0) {
          ctx.addIssue({
            code: 'custom',
            message: t('refundModal.notPositive', { ns: 'transactions' }),
            path: ['items', index, 'quantity'],
          });
          return;
        }
        if (quantity > max) {
          ctx.addIssue({
            code: 'custom',
            message: t('refundModal.exceedsRefundable', { max, ns: 'transactions' }),
            path: ['items', index, 'quantity'],
          });
          return;
        }
        selected += quantity;
      });

      if (selected === 0) {
        ctx.addIssue({
          code: 'custom',
          message: t('refundModal.nothingSelected', { ns: 'transactions' }),
          path: ['items'],
        });
      }
    });

export type RefundTransactionSchema = z.infer<ReturnType<typeof refundTransactionSchema>>;
export type RefundTransactionInput = z.input<ReturnType<typeof refundTransactionSchema>>;
