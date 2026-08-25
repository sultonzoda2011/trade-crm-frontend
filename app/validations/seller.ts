import type { TFunction } from 'i18next';
import { z } from 'zod';

export const createSellerSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t('nameRequired', { ns: 'validation' })),
    email: z
      .string()
      .email(t('emailInvalid', { ns: 'validation' }))
      .min(1, t('emailRequired', { ns: 'validation' })),
    password: z.string().min(1, t('passwordRequired', { ns: 'validation' })),
    image: z.any().optional(),
  });

export type CreateSellerSchema = z.infer<ReturnType<typeof createSellerSchema>>;

export const updateSellerSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t('nameRequired', { ns: 'validation' })),
    email: z
      .string()
      .email(t('emailInvalid', { ns: 'validation' }))
      .min(1, t('emailRequired', { ns: 'validation' })),
    password: z
      .string()
      .transform((v) => v || undefined)
      .optional(),
    image: z.any().optional(),
  });

export type UpdateSellerSchema = z.infer<ReturnType<typeof updateSellerSchema>>;

/**
 * Форма выдачи накопленной надбавки. amount ограничен максимум балансом
 * продавца на момент открытия модалки — тем же способом, каким backend
 * это перепроверяет на своей стороне (единый источник правды — сервер,
 * фронт лишь экономит пользователю лишний round trip).
 */
export const createSellerCreditSchema = (t: TFunction, maxBalance: number) =>
  z.object({
    amount: z
      .union([z.string(), z.number()])
      .refine((v) => v !== '' && Number.isFinite(Number(v)) && Number(v) > 0, {
        message: t('required', { ns: 'validation' }),
      })
      .refine((v) => Number(v) <= maxBalance, {
        message: t('sellerCreditExceedsBalance', { ns: 'validation' }),
      }),
    note: z.string().max(500, t('stringMax', { count: 500, ns: 'validation' })).optional(),
  });

export type CreateSellerCreditSchema = z.infer<ReturnType<typeof createSellerCreditSchema>>;
export type CreateSellerCreditInput = z.input<ReturnType<typeof createSellerCreditSchema>>;
