import type { TFunction } from 'i18next';
import { z } from 'zod';

export const createUserSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t('nameRequired', { ns: 'validation' })),
    email: z
      .string()
      .email(t('emailInvalid', { ns: 'validation' }))
      .min(1, t('emailRequired', { ns: 'validation' })),
    password: z.string().min(1, t('passwordRequired', { ns: 'validation' })),
    role: z.string().min(1, t('roleRequired', { ns: 'validation' })),
  });

export type CreateUserSchema = z.infer<ReturnType<typeof createUserSchema>>;

export const updateUserSchema = (t: TFunction) =>
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
    role: z.string().min(1, t('roleRequired', { ns: 'validation' })),
  });

export type UpdateUserSchema = z.infer<ReturnType<typeof updateUserSchema>>;
