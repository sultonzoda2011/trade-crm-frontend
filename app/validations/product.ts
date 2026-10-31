import type { TFunction } from 'i18next';
import { z } from 'zod';

/** Потолок на стороне бэкенда (`MAX_STOCK`): одно пополнение и остаток после него. */
export const MAX_RESTOCK = 1_000_000_000;

const NOTE_MAX = 200;

/**
 * Необязательное число. Очищенное поле отдаёт '' (см. FormInput) — это «не задано», а не ошибка;
 * в мультипарт-тело '' не попадает (buildMultipart его пропускает).
 */
const optionalNumber = (min: number) => z.union([z.number().min(min), z.literal('')]).optional();

const productBase = (t: TFunction) => ({
  name: z.string().min(2, t('required', { ns: 'validation' })),
  description: z.string().optional(),
  price: z.number({ error: t('required', { ns: 'validation' }) }).min(0.01, t('required', { ns: 'validation' })),
  /** Закупочная: нужна только для прибыли и «стоимости склада». Без неё товар продаётся как раньше. */
  costPrice: optionalNumber(0),
  unit: z.enum(['PCS', 'KG', 'L', 'M', 'BOX']).optional(),
  lowStockThreshold: optionalNumber(0),
  categoryId: z.string().optional(),
  image: z.any().optional(),
});

/** Создание: `quantity` — начальный остаток, он же запись «Начальный остаток» в журнале. */
export const createProductSchema = (t: TFunction) =>
  z.object({
    ...productBase(t),
    quantity: z.number({ error: t('required', { ns: 'validation' }) }).min(0, t('required', { ns: 'validation' })),
  });

export type CreateProductSchema = z.infer<ReturnType<typeof createProductSchema>>;

/**
 * Правка: остатка здесь НЕТ. Его меняют только «Пополнить», «Списать» и «Пересчитать» — каждое
 * оставляет след в журнале, а бэкенд отвечает 400 на PATCH с `quantity`.
 */
export const updateProductSchema = (t: TFunction) => z.object(productBase(t));

export type UpdateProductSchema = z.infer<ReturnType<typeof updateProductSchema>>;

/** Сколько ДОБАВИТЬ к остатку — не новый итог. */
export const createRestockSchema = (t: TFunction) =>
  z.object({
    quantity: z
      .number({ error: t('required', { ns: 'validation' }) })
      .int(t('quantityMin', { ns: 'validation' }))
      .min(1, t('quantityMin', { ns: 'validation' }))
      .max(MAX_RESTOCK, t('quantityMax', { ns: 'validation' })),
    note: z.string().max(NOTE_MAX).optional(),
  });

export type RestockSchema = z.infer<ReturnType<typeof createRestockSchema>>;

/** Сколько СПИСАТЬ и почему. Причина обязательна: без неё журнал бесполезен. */
export const createWriteOffSchema = (t: TFunction) =>
  z.object({
    quantity: z
      .number({ error: t('required', { ns: 'validation' }) })
      .int(t('quantityMin', { ns: 'validation' }))
      .min(1, t('quantityMin', { ns: 'validation' }))
      .max(MAX_RESTOCK, t('quantityMax', { ns: 'validation' })),
    reason: z.enum(['DAMAGED', 'EXPIRED', 'LOST', 'OWN_USE', 'OTHER'], { error: t('required', { ns: 'validation' }) }),
    note: z.string().max(NOTE_MAX).optional(),
  });

export type WriteOffSchema = z.infer<ReturnType<typeof createWriteOffSchema>>;

/** Пересчёт: сколько ЛЕЖИТ на самом деле — новый итог, 0 допустим. */
export const createAdjustSchema = (t: TFunction) =>
  z.object({
    quantity: z
      .number({ error: t('required', { ns: 'validation' }) })
      .int(t('quantityMin', { ns: 'validation' }))
      .min(0, t('quantityNonNegative', { ns: 'validation' }))
      .max(MAX_RESTOCK, t('quantityMax', { ns: 'validation' })),
    note: z.string().max(NOTE_MAX).optional(),
  });

export type AdjustSchema = z.infer<ReturnType<typeof createAdjustSchema>>;

/** Массовая цена: процент от −90 до +500 (как на бэкенде), 0 — не изменение. */
export const createBulkPriceSchema = (t: TFunction) =>
  z.object({
    percent: z
      .number({ error: t('required', { ns: 'validation' }) })
      .min(-90, t('percentRange', { ns: 'validation' }))
      .max(500, t('percentRange', { ns: 'validation' }))
      .refine((v) => v !== 0, t('percentZero', { ns: 'validation' })),
    categoryId: z.string().optional(),
    roundTo: optionalNumber(0.01),
  });

export type BulkPriceSchema = z.infer<ReturnType<typeof createBulkPriceSchema>>;
