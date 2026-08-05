import type { TFunction } from 'i18next';
import { z } from 'zod';

export const updateProfileSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t('nameRequired', { ns: 'validation' })),
    email: z
      .string()
      .email(t('emailInvalid', { ns: 'validation' }))
      .min(1, t('emailRequired', { ns: 'validation' })),
    image: z.any().optional(),
  });

export type UpdateProfileSchema = z.infer<ReturnType<typeof updateProfileSchema>>;

export const changePasswordSchema = (t: TFunction) =>
  z
    .object({
      currentPassword: z.string().min(1, t('oldPassRequired', { ns: 'validation' })),
      newPassword: z.string().min(8, t('passwordMinLength', { ns: 'validation' })),
      confirmPassword: z.string().min(1, t('passwordRequired', { ns: 'validation' })),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('passwordMismatch', { ns: 'validation' }),
      path: ['confirmPassword'],
    });

export type ChangePasswordSchema = z.infer<ReturnType<typeof changePasswordSchema>>;
