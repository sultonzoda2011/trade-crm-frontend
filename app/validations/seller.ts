import type { TFunction } from 'i18next';
import { z } from 'zod';
import { isStrongPassword } from '~/lib/password-rules';

/** Как на бэкенде (`PHONE_PATTERN`): цифры, пробелы, дефисы, скобки, ведущий «+». */
const PHONE_PATTERN = /^\+?[0-9\s\-()]{7,20}$/;

const phoneField = (t: TFunction) =>
  z
    .string()
    .trim()
    .refine((v) => v === '' || PHONE_PATTERN.test(v), t('phoneInvalid', { ns: 'validation' }));

/** `needMarket` — создаёт администратор: у него нет «своего» рынка, продавца надо к нему привязать. */
export const createSellerSchema = (t: TFunction, needMarket = false) =>
  z.object({
    name: z.string().min(1, t('nameRequired', { ns: 'validation' })),
    email: z
      .string()
      .email(t('emailInvalid', { ns: 'validation' }))
      .min(1, t('emailRequired', { ns: 'validation' })),
    phone: phoneField(t),
    password: z
      .string()
      .min(1, t('passwordRequired', { ns: 'validation' }))
      .refine(isStrongPassword, t('passwordWeak', { ns: 'validation' })),
    marketId: needMarket ? z.string().min(1, t('required', { ns: 'validation' })) : z.string().optional(),
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
    phone: phoneField(t),
    password: z
      .string()
      .refine((v) => v === '' || isStrongPassword(v), t('passwordWeak', { ns: 'validation' }))
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
      // Деньги — до копеек: бэкенд отклонит больше двух знаков, лучше сказать об этом сразу.
      .refine((v) => Math.abs(Number(v) * 100 - Math.round(Number(v) * 100)) < 1e-6, {
        message: t('amountDecimals', { ns: 'validation' }),
      })
      .refine((v) => Number(v) <= maxBalance, {
        message: t('sellerCreditExceedsBalance', { ns: 'validation' }),
      }),
    note: z
      .string()
      .max(500, t('stringMax', { count: 500, ns: 'validation' }))
      .optional(),
  });

export type CreateSellerCreditSchema = z.infer<ReturnType<typeof createSellerCreditSchema>>;
export type CreateSellerCreditInput = z.input<ReturnType<typeof createSellerCreditSchema>>;
