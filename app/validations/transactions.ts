import type { TFunction } from 'i18next';
import { z } from 'zod';

// Цена больше не валидируется/не собирается на фронте — сервер всегда берёт её
// из карточки товара. С фронта можно передать только скидку на позицию.
export const createTransactionItemSchema = (t: TFunction) =>
  z.object({
    productId: z.string().min(1, t('required', { ns: 'validation' })),
    quantity: z.number().min(1, t('required', { ns: 'validation' })),
    discount: z.number().min(0, t('required', { ns: 'validation' })).optional(),
    // Только для отображения цены/суммы строки в форме — на бэкенд не отправляется.
    price: z.number().optional(),
  });

export type CreateTransactionItemSchema = z.infer<ReturnType<typeof createTransactionItemSchema>>;

export const createTransactionSchema = (t: TFunction) =>
  z.object({
    debtorId: z.string().optional(),
    type: z.enum(['DEBT', 'SALE']),
    paymentType: z.enum(['CASH', 'CARD', 'CREDIT']),
    dueDate: z.string().optional(),
    items: z.array(createTransactionItemSchema(t)).min(1, t('required', { ns: 'validation' })),
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
