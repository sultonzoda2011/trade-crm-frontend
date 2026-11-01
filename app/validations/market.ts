import type { TFunction } from 'i18next';
import { z } from 'zod';

/** Тот же шаблон, что у бэкенда (CreateMarketDto.phone). */
const PHONE_PATTERN = /^\+?[0-9\s\-()]{7,20}$/;

const marketBase = (t: TFunction) => ({
  name: z
    .string()
    .trim()
    .min(1, t('required', { ns: 'validation' }))
    .min(2, t('stringMin', { ns: 'validation', count: 2 }))
    .max(200, t('stringMax', { ns: 'validation', count: 200 })),
  address: z
    .string()
    .trim()
    .min(1, t('required', { ns: 'validation' }))
    .min(5, t('stringMin', { ns: 'validation', count: 5 }))
    .max(500, t('stringMax', { ns: 'validation', count: 500 })),
  phone: z
    .string()
    .trim()
    .refine((v) => v === '' || PHONE_PATTERN.test(v), t('phoneInvalid', { ns: 'validation' })),
  workHours: z
    .string()
    .trim()
    .max(200, t('stringMax', { ns: 'validation', count: 200 })),
  image: z.any().optional(),
});

/** Создаёт рынок только админ — владельца он выбирает обязательно. */
export const createMarketSchema = (t: TFunction) =>
  z.object({ ...marketBase(t), ownerId: z.string().min(1, t('required', { ns: 'validation' })) });

export type CreateMarketSchema = z.infer<ReturnType<typeof createMarketSchema>>;

/** Владельца при правке меняет только админ; у владельца поля нет вовсе. */
export const updateMarketSchema = (t: TFunction) => z.object({ ...marketBase(t), ownerId: z.string().optional() });

export type UpdateMarketSchema = z.infer<ReturnType<typeof updateMarketSchema>>;
