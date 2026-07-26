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
