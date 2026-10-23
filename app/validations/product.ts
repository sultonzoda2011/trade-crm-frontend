import type { TFunction } from 'i18next';
import { z } from 'zod';

export const createProductSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t('required', { ns: 'validation' })),
    description: z.string().min(1, t('required', { ns: 'validation' })),
    price: z.number().min(1, t('required', { ns: 'validation' })),
    quantity: z.number().min(0, t('required', { ns: 'validation' })),
    unit: z.enum(['PCS', 'KG', 'L', 'M', 'BOX']).optional(),
    lowStockThreshold: z
      .number()
      .min(0, t('required', { ns: 'validation' }))
      .optional(),
    categoryId: z.string().optional(),
    image: z.any().optional(),
  });

export type CreateProductSchema = z.infer<ReturnType<typeof createProductSchema>>;

export const updateProductSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(2, t('required', { ns: 'validation' })),
    description: z.string().min(1, t('required', { ns: 'validation' })),
    price: z.number().min(1, t('required', { ns: 'validation' })),
    quantity: z.number().min(0, t('required', { ns: 'validation' })),
    unit: z.enum(['PCS', 'KG', 'L', 'M', 'BOX']).optional(),
    lowStockThreshold: z
      .number()
      .min(0, t('required', { ns: 'validation' }))
      .optional(),
    categoryId: z.string().optional(),
    image: z.any().optional(),
  });

export type UpdateProductSchema = z.infer<ReturnType<typeof updateProductSchema>>;

/** Потолок на стороне бэкенда (`MAX_STOCK`): одно пополнение и остаток после него. */
export const MAX_RESTOCK = 1_000_000_000;

/** Сколько ДОБАВИТЬ к остатку — не новый итог. */
export const createRestockSchema = (t: TFunction) =>
  z.object({
    quantity: z
      .number({ error: t('required', { ns: 'validation' }) })
      .int(t('quantityMin', { ns: 'validation' }))
      .min(1, t('quantityMin', { ns: 'validation' }))
      .max(MAX_RESTOCK, t('quantityMax', { ns: 'validation' })),
  });

export type RestockSchema = z.infer<ReturnType<typeof createRestockSchema>>;
