import type { TFunction } from 'i18next';
import { z } from 'zod';

export const createLoginSchema = (t: TFunction) =>
  z.object({
    username: z.string().min(1, t('usernameRequired')),
    password: z.string().min(1, t('passwordRequired')),
  });
export const changePasswordSchema = (t: TFunction) =>
  z.object({
    oldPassword: z.string().min(1, t('oldPassRequired', { ns: 'validation' })),
    newPassword: z.string().min(8, t('passwordMinLength', { ns: 'validation' })),
    confirmPassword: z.string().min(8, t('passwordMinLength', { ns: 'validation' })),
  });
export const changeMailSchema = (t: TFunction) =>
  z.object({
    newEmail: z.string().email(t('invalidEmail', { ns: 'validation' })),
  });
export const updateProfilePictureSchema = (t: TFunction) =>
  z.object({
    profilePicture: z
      .union([
        z.string(),
        z.instanceof(File).refine((file) => file.type.startsWith('image/'), {
          message: t('fileMustBeImage', { ns: 'validation' }),
        }),
      ])
      .nullish(),
  });
export type LoginForm = z.infer<ReturnType<typeof createLoginSchema>>;
export type ChangePasswordForm = z.infer<ReturnType<typeof changePasswordSchema>>;
export type ChangeMailForm = z.infer<ReturnType<typeof changeMailSchema>>;
export type UpdateProfilePictureForm = z.infer<ReturnType<typeof updateProfilePictureSchema>>;
