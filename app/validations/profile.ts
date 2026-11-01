import type { TFunction } from 'i18next';
import { z } from 'zod';
import { isStrongPassword, PASSWORD_MIN_LENGTH } from '~/lib/password-rules';

/** Тот же шаблон, что у бэкенда (UpdateProfileDto.phone). */
const PHONE_PATTERN = /^\+?[0-9\s\-()]{7,20}$/;

/**
 * Редактирование профиля. Почту можно менять только вместе с текущим паролем
 * (восстановления доступа нет — чужой телефон с открытым приложением не должен
 * уметь «увести» аккаунт на другую почту), поэтому схема знает прежний email.
 */
export const updateProfileSchema = (t: TFunction, originalEmail: string) =>
  z
    .object({
      name: z
        .string()
        .trim()
        .min(2, t('nameMin', { ns: 'validation' }))
        .max(100, t('stringMax', { ns: 'validation', count: 100 })),
      email: z
        .string()
        .trim()
        .min(1, t('emailRequired', { ns: 'validation' }))
        .email(t('emailInvalid', { ns: 'validation' })),
      phone: z
        .string()
        .trim()
        .refine((v) => v === '' || PHONE_PATTERN.test(v), t('phoneInvalid', { ns: 'validation' })),
      currentPassword: z.string().optional(),
      image: z.any().optional(),
    })
    .superRefine((data, ctx) => {
      const changed = data.email.trim().toLowerCase() !== originalEmail.trim().toLowerCase();
      if (changed && !data.currentPassword) {
        ctx.addIssue({
          code: 'custom',
          path: ['currentPassword'],
          message: t('currentPasswordForEmail', { ns: 'validation' }),
        });
      }
    });

export type UpdateProfileSchema = z.infer<ReturnType<typeof updateProfileSchema>>;

export const changePasswordSchema = (t: TFunction) =>
  z
    .object({
      currentPassword: z.string().min(1, t('oldPassRequired', { ns: 'validation' })),
      newPassword: z
        .string()
        .min(PASSWORD_MIN_LENGTH, t('passwordMinLength', { ns: 'validation' }))
        .refine(isStrongPassword, t('passwordWeak', { ns: 'validation' })),
      confirmPassword: z.string().min(1, t('confirmRequired', { ns: 'validation' })),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('passwordMismatch', { ns: 'validation' }),
      path: ['confirmPassword'],
    })
    .refine((data) => !data.currentPassword || data.newPassword !== data.currentPassword, {
      message: t('passwordSame', { ns: 'validation' }),
      path: ['newPassword'],
    });

export type ChangePasswordSchema = z.infer<ReturnType<typeof changePasswordSchema>>;
