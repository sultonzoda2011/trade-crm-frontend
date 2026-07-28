import type { TFunction } from 'i18next';
import { z } from 'zod';

export const createTransactionItemSchema = (t: TFunction) =>
  z.object({
    productId: z.string().min(1, t('itemProductRequired', { ns: 'validation' })),
    quantity: z.number().min(1, t('quantityMin', { ns: 'validation' })),
    discount: z.number().min(0, t('discountMin', { ns: 'validation' })).optional(),
  });

export type CreateTransactionItemSchema = z.infer<ReturnType<typeof createTransactionItemSchema>>;

export const createTransactionSchema = (t: TFunction) =>
  z.object({
    debtorId: z.string().optional(),
    type: z.enum(['DEBT', 'SALE']),
    paymentType: z.enum(['CASH', 'CARD', 'CREDIT']),
    dueDate: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
        { message: t('invalidDate', { ns: 'validation' }) }
      ),
    items: z.array(createTransactionItemSchema(t)).min(1, t('itemsRequired', { ns: 'validation' })),
  }).superRefine((data, ctx) => {
    if (data.type === 'DEBT' && !data.dueDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t('dueDateRequired', { ns: 'validation' }),
        path: ['dueDate'],
      });
    }
  });

export type CreateTransactionSchema = z.infer<ReturnType<typeof createTransactionSchema>>;

export const updateTransactionSchema = (t: TFunction) =>
  z.object({
    debtorId: z.string().optional(),
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
