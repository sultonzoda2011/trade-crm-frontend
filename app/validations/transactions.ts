import type { TFunction } from 'i18next';
import { z } from 'zod';

export const createTransactionItemSchema = (t: TFunction) =>
  z.object({
    productId: z.string().min(1, t('required', { ns: 'validation' })),
    quantity: z.number().min(1, t('required', { ns: 'validation' })),
    price: z.number().min(0, t('required', { ns: 'validation' })),
  });

export type CreateTransactionItemSchema = z.infer<ReturnType<typeof createTransactionItemSchema>>;

export const createTransactionSchema = (t: TFunction) =>
  z.object({
    debtorId: z.string(),
    type: z.enum(['DEBT', 'SALE']),
    paymentType: z.enum(['CASH', 'CARD', 'CREDIT']),
    items: z.array(createTransactionItemSchema(t)).min(1, t('required', { ns: 'validation' })),
  });

export type CreateTransactionSchema = z.infer<ReturnType<typeof createTransactionSchema>>;

export const updateTransactionSchema = (t: TFunction) =>
  z.object({
    debtorId: z.string(),
    type: z.enum(['DEBT', 'SALE']),
    paymentType: z.enum(['CASH', 'CARD', 'CREDIT']),
  });

export type UpdateTransactionSchema = z.infer<ReturnType<typeof updateTransactionSchema>>;

export const createPaymentSchema = (t: TFunction) =>
  z.object({
    amount: z.number().min(1, t('required', { ns: 'validation' })),
    note: z.string(),
  });

export type CreatePaymentSchema = z.infer<ReturnType<typeof createPaymentSchema>>;
